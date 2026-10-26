import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { calculateTotals, type TotalsLine } from './totals';

const line = (overrides: Partial<TotalsLine> = {}): TotalsLine => ({
  unitPrice: money(11900),
  quantity: 1,
  taxRateBps: 1900,
  discount: money(0),
  voided: false,
  ...overrides,
});

describe('calculateTotals', () => {
  it('precios con IVA incluido: el total es la suma de precios', () => {
    const totals = calculateTotals([line({ quantity: 2 })], { pricesIncludeTax: true });
    expect(totals).toMatchObject({ total: 23800, subtotal: 20000, taxTotal: 3800, itemCount: 2 });
  });

  it('precios sin IVA: el impuesto se suma', () => {
    const totals = calculateTotals([line({ unitPrice: money(10000) })], {
      pricesIncludeTax: false,
    });
    expect(totals).toMatchObject({ total: 11900, subtotal: 10000, taxTotal: 1900 });
  });

  it('excluye ítems anulados (L7)', () => {
    const totals = calculateTotals([line(), line({ voided: true, quantity: 5 })], {
      pricesIncludeTax: true,
    });
    expect(totals.total).toBe(11900);
    expect(totals.itemCount).toBe(1);
  });

  it('aplica descuentos sin dejar líneas negativas', () => {
    const totals = calculateTotals(
      [line({ discount: money(1900) }), line({ discount: money(99999) })],
      { pricesIncludeTax: true },
    );
    expect(totals.discountTotal).toBe(11900 + 1900);
    expect(totals.total).toBe(10000);
  });

  it('agrupa impuestos por tasa, de mayor a menor', () => {
    const totals = calculateTotals(
      [
        line(),
        line({ unitPrice: money(10500), taxRateBps: 500 }),
        line({ unitPrice: money(5000), taxRateBps: 0 }),
      ],
      { pricesIncludeTax: true },
    );
    expect(totals.taxes).toEqual([
      { rateBps: 1900, base: 10000, tax: 1900 },
      { rateBps: 500, base: 10000, tax: 500 },
      { rateBps: 0, base: 5000, tax: 0 },
    ]);
    expect(totals.total).toBe(27400);
  });

  it('cantidades decimales redondean en la unidad mínima', () => {
    const totals = calculateTotals(
      [line({ unitPrice: money(999), quantity: 1.5, taxRateBps: 0 })],
      { pricesIncludeTax: true },
    );
    expect(totals.total).toBe(1499);
  });

  it('carrito vacío da ceros', () => {
    expect(calculateTotals([], { pricesIncludeTax: true })).toMatchObject({
      total: 0,
      itemCount: 0,
      taxes: [],
    });
  });
});
