import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { salesByDay, summarizeSales, topProducts, type ReportSale } from './salesSummary';

const sale = (
  id: string,
  iso: string,
  total: number,
  lines: ReportSale['lines'] = [],
): ReportSale => ({
  id,
  occurredAt: new Date(iso),
  totalMinor: money(total),
  lines,
});

describe('reportes de ventas', () => {
  it('resume total, cantidad y ticket promedio', () => {
    expect(
      summarizeSales([
        sale('a', '2026-03-01T15:00:00Z', 1000),
        sale('b', '2026-03-01T16:00:00Z', 2001),
      ]),
    ).toEqual({
      total: 3001,
      count: 2,
      averageTicket: 1501,
    });
    expect(summarizeSales([]).averageTicket).toBe(0);
  });

  it('agrupa por día en la zona del negocio, incluyendo días vacíos', () => {
    // 2026-03-02T03:00Z es todavía 1 de marzo en Bogotá.
    const sales = [
      sale('a', '2026-03-01T15:00:00Z', 1000),
      sale('b', '2026-03-02T03:00:00Z', 500),
      sale('c', '2026-03-03T15:00:00Z', 700),
    ];
    const days = salesByDay(sales, 'America/Bogota', new Date('2026-03-01T12:00:00Z'), 3);
    expect(days.map((d) => [d.day.toISOString(), d.total, d.count])).toEqual([
      ['2026-03-01T05:00:00.000Z', 1500, 2],
      ['2026-03-02T05:00:00.000Z', 0, 0],
      ['2026-03-03T05:00:00.000Z', 700, 1],
    ]);
  });

  it('ordena productos por cantidad vendida sin contar anulados', () => {
    const sales = [
      sale('a', '2026-03-01T15:00:00Z', 0, [
        { productId: 'p1', name: 'Café', quantity: 2, voided: false },
        { productId: 'p2', name: 'Torta', quantity: 5, voided: true },
      ]),
      sale('b', '2026-03-01T15:00:00Z', 0, [
        { productId: 'p2', name: 'Torta', quantity: 1, voided: false },
      ]),
    ];
    expect(topProducts(sales, 5)).toEqual([
      { productId: 'p1', name: 'Café', quantity: 2 },
      { productId: 'p2', name: 'Torta', quantity: 1 },
    ]);
  });
});
