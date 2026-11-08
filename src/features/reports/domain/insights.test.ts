import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { hourInZone, paymentMix, salesByHour, salesCsv, type InsightSale } from './insights';

const sale = (iso: string, total: number, overrides: Partial<InsightSale> = {}): InsightSale => ({
  number: 'C1-1',
  occurredAt: new Date(iso),
  totalMinor: money(total),
  changeMinor: money(0),
  creditMinor: money(0),
  customerId: null,
  createdBy: 'ana',
  payments: [{ method: 'cash', amountMinor: money(total) }],
  lines: [
    { productId: 'p1', name: 'Café', quantity: 2, unitPriceMinor: money(total / 2), voided: false },
  ],
  ...overrides,
});

describe('análisis de ventas', () => {
  it('agrupa por hora en la zona del negocio', () => {
    // 13:30 UTC = 08:30 en Bogotá.
    expect(hourInZone(new Date('2026-11-01T13:30:00Z'), 'America/Bogota')).toBe(8);
    const hours = salesByHour(
      [sale('2026-11-01T13:30:00Z', 1000), sale('2026-11-02T13:59:00Z', 500)],
      'America/Bogota',
    );
    expect(hours).toHaveLength(24);
    expect(hours[8]).toMatchObject({ total: 1500, count: 2 });
  });

  it('mezcla de medios de pago con efectivo neto de vuelto', () => {
    const mix = paymentMix([
      sale('2026-11-01T13:00:00Z', 1000, {
        payments: [{ method: 'cash', amountMinor: money(1200) }],
        changeMinor: money(200),
      }),
      sale('2026-11-01T13:00:00Z', 3000, {
        payments: [{ method: 'card', amountMinor: money(3000) }],
      }),
    ]);
    expect(mix.map((m) => [m.method, m.total, m.share])).toEqual([
      ['card', 3000, 0.75],
      ['cash', 1000, 0.25],
    ]);
  });

  it('exporta CSV escapando comas', () => {
    const csv = salesCsv(
      [
        sale('2026-11-01T13:00:00Z', 2000, {
          lines: [
            {
              productId: 'p',
              name: 'Pan, grande',
              quantity: 1,
              unitPriceMinor: money(2000),
              voided: false,
            },
          ],
        }),
      ],
      'COP',
      () => '2026-11-01',
      () => 'Ana',
    );
    expect(csv.split('\n')[1]).toBe('C1-1,2026-11-01,20,cash,0,,Ana,"1x Pan, grande"');
  });
});
