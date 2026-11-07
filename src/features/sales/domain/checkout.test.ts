import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { addToCart, toTotalsLines } from './cart';
import { buildCheckout } from './checkout';
import { calculateTotals } from './totals';

const coffee = { id: 'p1', name: 'Café', priceMinor: money(350000), taxRateBps: 0, stock: 5 };
const service = { id: 'p2', name: 'Servicio', priceMinor: money(100000), taxRateBps: 0 };
const lines = addToCart(addToCart(addToCart([], coffee), coffee), service);
const base = {
  id: 's1',
  deviceCode: 'CAJA1',
  cashShiftId: 'shift1',
  terminalId: 'term1',
  lines,
  totals: calculateTotals(toTotalsLines(lines), { pricesIncludeTax: true }),
  occurredAt: new Date('2026-10-26T12:00:00Z'),
  tracksStock: (id: string) => id === 'p1',
};

describe('buildCheckout', () => {
  it('arma la venta con vuelto y descuenta stock solo de productos con control', () => {
    const result = buildCheckout({ ...base, tenders: [{ method: 'cash', amount: money(900000) }] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sale).toMatchObject({
      totalMinor: 800000,
      changeMinor: 100000,
      cashShiftId: 'shift1',
      payments: [{ method: 'cash', amountMinor: 900000, status: 'captured' }],
    });
    expect(result.value.stock).toEqual([{ productId: 'p1', quantity: 2 }]);
  });

  it('rechaza pagos insuficientes o un carrito vacío', () => {
    expect(buildCheckout({ ...base, tenders: [{ method: 'card', amount: money(1) }] }).ok).toBe(
      false,
    );
    expect(buildCheckout({ ...base, lines: [], tenders: [] }).ok).toBe(false);
  });
});
