import { strToU8, zipSync } from 'fflate';

export type Cell = string | number;

export interface Sheet {
  /** Nombre de la hoja (se recorta a 31 caracteres válidos en Excel). */
  name: string;
  columns: readonly string[];
  rows: readonly (readonly Cell[])[];
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};
const xml = (text: string) => text.replace(/[&<>"]/g, (c) => XML_ESCAPES[c] ?? c);

/** "A", "B", …, "Z", "AA"… */
function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

function sheetXml(sheet: Sheet): string {
  const rows = [sheet.columns, ...sheet.rows].map((row, r) => {
    const cells = row.map((value, c) => {
      const ref = `${columnName(c)}${String(r + 1)}`;
      return typeof value === 'number' && Number.isFinite(value)
        ? `<c r="${ref}"><v>${String(value)}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(String(value))}</t></is></c>`;
    });
    return `<row r="${String(r + 1)}">${cells.join('')}</row>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.join('')}</sheetData></worksheet>`;
}

const safeSheetName = (name: string, index: number) =>
  name
    .replace(/[[\]:*?/\\]/g, ' ')
    .slice(0, 31)
    .trim() || `Hoja ${String(index + 1)}`;

/**
 * Libro `.xlsx` mínimo (Office Open XML) sin dependencias de hojas de cálculo: números como números
 * y texto en línea. Basta para abrir en Excel, LibreOffice o Google Sheets.
 */
export function buildXlsx(sheets: readonly Sheet[]): Uint8Array {
  const names = sheets.map((sheet, i) => safeSheetName(sheet.name, i));
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${String(i + 1)}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name, i) => `<sheet name="${xml(name)}" sheetId="${String(i + 1)}" r:id="rId${String(i + 1)}"/>`).join('')}</sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${String(i + 1)}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${String(i + 1)}.xml"/>`).join('')}</Relationships>`,
    ),
  };
  sheets.forEach((sheet, i) => {
    files[`xl/worksheets/sheet${String(i + 1)}.xml`] = strToU8(sheetXml(sheet));
  });
  return zipSync(files);
}

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Descarga un archivo generado en el navegador. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export interface PdfReport {
  title: string;
  subtitle?: string;
  sections: readonly Sheet[];
}

/** PDF de tablas (A4 horizontal) con salto de página automático. jsPDF se carga bajo demanda. */
export async function buildTablesPdf(report: PdfReport): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margin = 36;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - margin;
  let y = margin;
  const ensure = (height: number) => {
    if (y + height > bottom) {
      pdf.addPage();
      y = margin;
    }
  };
  pdf.setFontSize(16).text(report.title, margin, y + 12);
  y += 24;
  if (report.subtitle) {
    pdf
      .setFontSize(10)
      .setTextColor(100)
      .text(report.subtitle, margin, y + 8);
    pdf.setTextColor(0);
    y += 18;
  }
  for (const section of report.sections) {
    ensure(40);
    y += 10;
    pdf
      .setFontSize(12)
      .setFont('helvetica', 'bold')
      .text(section.name, margin, y + 10);
    y += 18;
    const colWidth = width / Math.max(1, section.columns.length);
    const drawRow = (cells: readonly Cell[], bold: boolean) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(9);
      const wrapped = cells.map(
        (cell) => pdf.splitTextToSize(String(cell), colWidth - 6) as string[],
      );
      const height = Math.max(...wrapped.map((lines) => lines.length)) * 11 + 4;
      ensure(height);
      wrapped.forEach((lines, c) => {
        const numeric = typeof cells[c] === 'number';
        const x = numeric ? margin + colWidth * (c + 1) - 3 : margin + colWidth * c + 3;
        pdf.text(lines, x, y + 10, numeric ? { align: 'right' } : undefined);
      });
      y += height;
      pdf.setDrawColor(220).line(margin, y, margin + width, y);
    };
    drawRow(section.columns, true);
    for (const row of section.rows) drawRow(row, false);
  }
  return pdf.output('blob');
}
