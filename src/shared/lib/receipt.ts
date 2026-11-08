/** Ticket ya formateado (montos y fechas como texto): lo arma la UI con los formatters. */
export interface ReceiptView {
  title: string;
  subtitle?: string;
  lines: readonly { label: string; value: string }[];
  totals: readonly { label: string; value: string; emphasis?: boolean }[];
  footer: readonly string[];
}

/** Versión en texto (cuerpo de WhatsApp o correo). */
export function receiptText(receipt: ReceiptView): string {
  return [
    receipt.title,
    ...(receipt.subtitle ? [receipt.subtitle] : []),
    '',
    ...receipt.lines.map((line) => `${line.label}  ${line.value}`),
    '',
    ...receipt.totals.map((total) => `${total.label}: ${total.value}`),
    '',
    ...receipt.footer,
  ].join('\n');
}

const WIDTH = 576; // 80 mm a 203 ppp, el ancho de una impresora térmica.
const PAD = 24;
const LINE = 30;

/** Imagen PNG del ticket (canvas del navegador), lista para compartir o descargar. */
export function renderReceiptPng(receipt: ReceiptView): Promise<Blob> {
  const rows: { left: string; right?: string; bold?: boolean; center?: boolean; size?: number }[] =
    [
      { left: receipt.title, bold: true, center: true, size: 30 },
      ...(receipt.subtitle ? [{ left: receipt.subtitle, center: true }] : []),
      { left: '' },
      ...receipt.lines.map((line) => ({ left: line.label, right: line.value })),
      { left: '' },
      ...receipt.totals.map((total) => ({
        left: total.label,
        right: total.value,
        bold: total.emphasis,
      })),
      { left: '' },
      ...receipt.footer.map((text) => ({ left: text, center: true, size: 20 })),
    ];
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = PAD * 2 + rows.length * LINE + 10;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas no disponible'));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'top';
  rows.forEach((row, index) => {
    const y = PAD + index * LINE;
    ctx.font = `${row.bold ? '700' : '400'} ${String(row.size ?? 22)}px system-ui, sans-serif`;
    if (row.center) {
      ctx.textAlign = 'center';
      ctx.fillText(row.left, WIDTH / 2, y, WIDTH - PAD * 2);
      return;
    }
    ctx.textAlign = 'left';
    ctx.fillText(row.left, PAD, y, row.right ? WIDTH * 0.62 : WIDTH - PAD * 2);
    if (row.right) {
      ctx.textAlign = 'right';
      ctx.fillText(row.right, WIDTH - PAD, y);
    }
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo generar la imagen'));
    }, 'image/png');
  });
}

/** PDF del ticket en papel de 80 mm de ancho (jsPDF bajo demanda). */
export async function renderReceiptPdf(receipt: ReceiptView): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const lineMm = 5;
  const rows = 4 + receipt.lines.length + receipt.totals.length + receipt.footer.length + 4;
  const pdf = new jsPDF({ unit: 'mm', format: [80, Math.max(80, rows * lineMm + 16)] });
  let y = 10;
  pdf
    .setFont('helvetica', 'bold')
    .setFontSize(12)
    .text(receipt.title, 40, y, { align: 'center', maxWidth: 70 });
  y += lineMm + 1;
  pdf.setFont('helvetica', 'normal').setFontSize(8);
  if (receipt.subtitle) {
    pdf.text(receipt.subtitle, 40, y, { align: 'center' });
    y += lineMm;
  }
  y += 2;
  for (const line of receipt.lines) {
    pdf.text(pdf.splitTextToSize(line.label, 48) as string[], 5, y);
    pdf.text(line.value, 75, y, { align: 'right' });
    y += lineMm;
  }
  y += 2;
  for (const total of receipt.totals) {
    pdf.setFont('helvetica', total.emphasis ? 'bold' : 'normal');
    pdf.text(total.label, 5, y);
    pdf.text(total.value, 75, y, { align: 'right' });
    y += lineMm;
  }
  pdf.setFont('helvetica', 'normal').setFontSize(7);
  y += 3;
  for (const text of receipt.footer) {
    pdf.text(text, 40, y, { align: 'center', maxWidth: 70 });
    y += lineMm - 1;
  }
  return pdf.output('blob');
}

/** `true` si el navegador puede compartir archivos (hoja nativa: WhatsApp, Gmail…). */
export function canShareFile(file: File): boolean {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}
