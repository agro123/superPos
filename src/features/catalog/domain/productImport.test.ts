import { describe, expect, it } from 'vitest';
import { IMPORT_COLUMNS, parseLocalNumber, planProductImport } from './productImport';

const header = [...IMPORT_COLUMNS];
const row = (values: Partial<Record<(typeof IMPORT_COLUMNS)[number], string>>) =>
  IMPORT_COLUMNS.map((c) => values[c] ?? '');

describe('importación masiva de productos', () => {
  it('interpreta números locales', () => {
    expect(parseLocalNumber('3.200', 0)).toBe(3200);
    expect(parseLocalNumber('$ 1.500', 0)).toBe(1500);
    expect(parseLocalNumber('12,50', 2)).toBe(12.5);
    expect(parseLocalNumber('1.234,5', 2)).toBe(1234.5);
    expect(parseLocalNumber('', 0)).toBeNull();
  });

  it('crea los nuevos, omite los que ya existen (catálogo o archivo) y reporta errores', () => {
    const plan = planProductImport(
      [
        header,
        row({
          nombre: 'Café molido',
          precio: '12.000',
          costo: '8000',
          categoria: 'Bebidas',
          stock_inicial: '10',
          impuesto_porcentaje: '19',
        }),
        row({ nombre: 'ARROZ 500 G', precio: '3200' }),
        row({ nombre: 'Otro', precio: '100', codigo_barras: '7701' }),
        row({ nombre: 'Café Molido', precio: '1' }),
        row({ nombre: 'Sin precio' }),
        row({ nombre: 'Bolsa', precio: '100', controla_stock: 'no', categoria: 'Varios' }),
      ],
      {
        currency: 'COP',
        existing: [{ name: 'Arroz 500 g', sku: null, barcode: '7701' }],
        categories: [{ name: 'bebidas' }],
      },
    );
    expect(plan.toCreate.map((c) => c.input.name)).toEqual(['Café molido', 'Bolsa']);
    expect(plan.toCreate[0]).toMatchObject({
      row: 2,
      categoryName: 'Bebidas',
      input: {
        priceMinor: 1200000,
        costMinor: 800000,
        taxRateBps: 1900,
        trackStock: true,
        initialStock: 10,
      },
    });
    expect(plan.toCreate[1]?.input.trackStock).toBe(false);
    expect(plan.duplicates.map((d) => d.row)).toEqual([3, 4, 5]);
    expect(plan.errors).toEqual([{ row: 6, name: 'Sin precio', message: 'priceMinor' }]);
    expect(plan.newCategories).toEqual(['Varios']);
  });

  it('exige las columnas nombre y precio', () => {
    expect(
      planProductImport([['producto']], { currency: 'COP', existing: [], categories: [] }).errors[0]
        ?.message,
    ).toBe('missingColumns');
  });
});
