import { describe, expect, it } from 'vitest';
import { buildXlsx } from './exportFiles';
import { parseCsv, readXlsx } from './importFiles';

describe('importar archivos', () => {
  it('lee CSV con punto y coma, comillas y BOM', () => {
    const rows = parseCsv('﻿nombre;precio\n"Pan; grande";3.200\r\n"Dice ""hola""";1000\n\n');
    expect(rows).toEqual([
      ['nombre', 'precio'],
      ['Pan; grande', '3.200'],
      ['Dice "hola"', '1000'],
    ]);
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('lee la primera hoja de un xlsx', () => {
    const bytes = buildXlsx([
      {
        name: 'Productos',
        columns: ['nombre', 'precio'],
        rows: [
          ['Café', 3500],
          ['Té', 2000],
        ],
      },
    ]);
    expect(readXlsx(bytes)).toEqual([
      ['nombre', 'precio'],
      ['Café', '3500'],
      ['Té', '2000'],
    ]);
  });
});
