import { describe, expect, it } from 'vitest';
import { purchaseOrderText, reorderSuggestions, unitsSoldByProduct } from './reorder';
import { stockChangeInputSchema, stockDelta } from './stockChange';

describe('entradas y ajustes', () => {
  it('calcula la diferencia a aplicar', () => {
    expect(stockDelta('purchase', 12, 3)).toBe(12);
    expect(stockDelta('adjustment', 8, 10)).toBe(-2);
  });

  it('valida cantidad de compra y motivo del ajuste', () => {
    const base = { reason: null, supplierId: null };
    expect(
      stockChangeInputSchema.safeParse({ ...base, mode: 'purchase', quantity: 0 }).success,
    ).toBe(false);
    expect(
      stockChangeInputSchema.safeParse({ ...base, mode: 'purchase', quantity: 5 }).success,
    ).toBe(true);
    expect(
      stockChangeInputSchema.safeParse({ ...base, mode: 'adjustment', quantity: 0 }).success,
    ).toBe(false);
    expect(
      stockChangeInputSchema.safeParse({
        ...base,
        mode: 'adjustment',
        quantity: 0,
        reason: 'Merma',
      }).success,
    ).toBe(true);
  });
});

describe('sugerencia de reabastecimiento', () => {
  const products = [
    { id: 'agotado', name: 'A', stock: 0, lowStockThreshold: 2 },
    { id: 'bajo', name: 'B', stock: 2, lowStockThreshold: 5 },
    { id: 'pronto', name: 'C', stock: 20, lowStockThreshold: 5 },
    { id: 'sobra', name: 'D', stock: 100, lowStockThreshold: 5 },
  ];
  const sold = unitsSoldByProduct([
    {
      lines: [
        { productId: 'pronto', quantity: 70, voided: false },
        { productId: 'bajo', quantity: 14, voided: false },
        { productId: 'sobra', quantity: 50, voided: true },
      ],
    },
  ]);

  it('lista agotados, bajo umbral y los que no alcanzan la entrega, con cantidad sugerida', () => {
    const rows = reorderSuggestions(products, sold, { periodDays: 14, coverDays: 14, leadDays: 7 });
    expect(rows.map((r) => [r.productId, r.urgency])).toEqual([
      ['agotado', 'out'],
      ['bajo', 'low'],
      ['pronto', 'soon'],
    ]);
    // 5/día × 14 días + umbral 5 − stock 20 = 55.
    expect(rows.find((r) => r.productId === 'pronto')).toMatchObject({
      daysLeft: 4,
      suggested: 55,
    });
    expect(rows.find((r) => r.productId === 'agotado')?.suggested).toBe(2);
  });

  it('arma el texto del pedido al proveedor', () => {
    expect(
      purchaseOrderText('Tienda Rosa', 'Distrivalle', [{ name: 'Arroz', quantity: 10 }]),
    ).toContain('• Arroz: 10');
  });
});
