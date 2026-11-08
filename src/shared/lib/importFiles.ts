import { strFromU8, unzipSync } from 'fflate';

/**
 * CSV a filas. Acepta coma o punto y coma (Excel en español guarda con `;`), comillas dobles con
 * escapes `""`, saltos de línea dentro de comillas y BOM inicial.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

/** "A1" → 0, "B7" → 1, "AA3" → 26. */
function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? 'A';
  let n = 0;
  for (let i = 0; i < letters.length; i += 1) n = n * 26 + letters.charCodeAt(i) - 64;
  return n - 1;
}

/** Primera hoja de un `.xlsx` a filas de texto (cadenas compartidas, en línea, números y booleanos). */
export function readXlsx(bytes: Uint8Array): string[][] {
  const files = unzipSync(bytes);
  const xml = (path: string) => {
    const file = files[path];
    return file ? new DOMParser().parseFromString(strFromU8(file), 'application/xml') : null;
  };
  const shared = [...(xml('xl/sharedStrings.xml')?.getElementsByTagName('si') ?? [])].map((si) =>
    [...si.getElementsByTagName('t')].map((t) => t.textContent).join(''),
  );
  const workbook = xml('xl/workbook.xml');
  const rels = xml('xl/_rels/workbook.xml.rels');
  const firstSheetRel = workbook?.getElementsByTagName('sheet')[0]?.getAttribute('r:id');
  const target = [...(rels?.getElementsByTagName('Relationship') ?? [])]
    .find((rel) => rel.getAttribute('Id') === firstSheetRel)
    ?.getAttribute('Target');
  const sheetPath = target ? `xl/${target.replace(/^\/?xl\//, '')}` : 'xl/worksheets/sheet1.xml';
  const sheet = xml(sheetPath);
  if (!sheet) return [];
  const rows: string[][] = [];
  for (const rowEl of sheet.getElementsByTagName('row')) {
    // Arreglo disperso: las celdas vacías no vienen en el XML.
    const row: (string | undefined)[] = [];
    for (const c of rowEl.getElementsByTagName('c')) {
      const type = c.getAttribute('t');
      const raw = c.getElementsByTagName('v')[0]?.textContent ?? '';
      const value =
        type === 's'
          ? (shared[Number(raw)] ?? '')
          : type === 'inlineStr'
            ? [...c.getElementsByTagName('t')].map((t) => t.textContent).join('')
            : type === 'b'
              ? raw === '1'
                ? 'si'
                : 'no'
              : raw;
      row[columnIndex(c.getAttribute('r') ?? '')] = value;
    }
    rows.push(Array.from(row, (value) => value ?? ''));
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}
