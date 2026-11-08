import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import type { InsightSale } from './insights';
import { workerPerformance } from './performance';
import { profitReport } from './profit';

const sale = (by: string, iso: string, lines: InsightSale['lines'], credit = 0): InsightSale => ({
  number: 'x',
  occurredAt: new Date(iso),
  totalMinor: money(lines.reduce((s, l) => s + l.unitPriceMinor * l.quantity, 0)),
  changeMinor: money(0),
  creditMinor: money(credit),
  customerId: null,
  createdBy: by,
  payments: [],
  lines,
});
const line = (productId: string, quantity: number, price: number, cost?: number | null) => ({
  productId,
  name: productId,
  quantity,
  unitPriceMinor: money(price),
  unitCostMinor: cost === undefined || cost === null ? null : money(cost),
  voided: false,
});

describe('desempeño por trabajador', () => {
  it('total, ticket, canasta, anulaciones, fiado, participación y mejor hora', () => {
    const rows = workerPerformance(
      [
        sale('ana', '2026-11-01T14:00:00Z', [line('a', 2, 1000)]),
        sale('ana', '2026-11-01T14:30:00Z', [line('a', 1, 2000)], 500),
        sale('luis', '2026-11-01T20:00:00Z', [line('b', 1, 1000)]),
      ],
      new Map([
        ['luis', 2],
        ['pepe', 1],
      ]),
      'America/Bogota',
    );
    expect(rows.map((r) => r.uid)).toEqual(['ana', 'luis', 'pepe']);
    expect(rows[0]).toMatchObject({
      salesCount: 2,
      total: 4000,
      averageTicket: 2000,
      units: 3,
      unitsPerSale: 1.5,
      creditGiven: 500,
      bestHour: 9,
    });
    expect(rows[0]?.share).toBeCloseTo(0.8);
    expect(rows[1]?.voidedCount).toBe(2);
    expect(rows[2]).toMatchObject({ salesCount: 0, voidedCount: 1, bestHour: null });
  });
});

describe('ganancia: dónde se gana o se pierde', () => {
  it('margen por producto y categoría, pérdidas, sin costo, gastos y merma', () => {
    const report = profitReport({
      sales: [
        sale('ana', '2026-11-01T14:00:00Z', [
          line('cafe', 2, 3000, 1000),
          line('pan', 1, 500, 800),
          line('raro', 1, 1000),
        ]),
      ],
      currentCost: (id) => (id === 'pan' ? money(9999) : id === 'cafe' ? money(1200) : null),
      categoryOf: (id) => (id === 'pan' ? 'Panadería' : 'Bebidas'),
      expenses: [money(1000)],
      adjustments: [
        { productId: 'cafe', quantityDelta: -2 },
        { productId: 'cafe', quantityDelta: 5 },
      ],
    });
    // El costo guardado en la venta manda sobre el actual.
    expect(report.byProduct.find((l) => l.key === 'cafe')).toMatchObject({
      revenue: 6000,
      cost: 2000,
      margin: 4000,
    });
    expect(report.losing.map((l) => l.key)).toEqual(['pan']);
    expect(report.withoutCost.map((l) => l.productId)).toEqual(['raro']);
    expect(report.byCategory.map((c) => c.key)).toEqual(['Bebidas', 'Panadería']);
    expect(report).toMatchObject({
      grossMargin: 3700,
      expenses: 1000,
      shrinkage: 2400,
      result: 300,
    });
    expect(report.coverage).toBeCloseTo(6500 / 7500);
  });
});
