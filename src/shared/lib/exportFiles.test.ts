import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildXlsx } from './exportFiles';

describe('buildXlsx', () => {
  it('arma un libro con hojas, números y texto escapado', () => {
    const zip = unzipSync(
      buildXlsx([
        {
          name: 'Ventas/día',
          columns: ['Día', 'Total'],
          rows: [
            ['1 nov', 12500],
            ['<2 & 3>', 0],
          ],
        },
        { name: 'Margen', columns: ['Producto'], rows: [['Café']] },
      ]),
    );
    expect(Object.keys(zip)).toContain('xl/worksheets/sheet2.xml');
    expect(strFromU8(zip['xl/workbook.xml'] ?? new Uint8Array())).toContain('name="Ventas día"');
    const sheet = strFromU8(zip['xl/worksheets/sheet1.xml'] ?? new Uint8Array());
    expect(sheet).toContain('<c r="B2"><v>12500</v></c>');
    expect(sheet).toContain('&lt;2 &amp; 3&gt;');
  });
});
