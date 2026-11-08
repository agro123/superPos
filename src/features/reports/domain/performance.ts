import { addMoney, money, roundDiv, ZERO_MONEY, type Money } from '@/shared/domain/money';
import { hourInZone, type InsightSale } from './insights';

export interface WorkerPerformance {
  uid: string;
  salesCount: number;
  total: Money;
  averageTicket: Money;
  units: number;
  /** Unidades por venta (canasta promedio). */
  unitsPerSale: number;
  /** Ventas de este trabajador que luego se anularon. */
  voidedCount: number;
  creditGiven: Money;
  /** Parte del total vendido del periodo (0–1). */
  share: number;
  /** Hora local con más ventas, o `null` si no vendió. */
  bestHour: number | null;
}

/**
 * Desempeño por trabajador en el periodo: cuánto vende, ticket promedio, canasta, anulaciones de
 * sus ventas, fiado otorgado y su mejor hora. Ordenado por total vendido.
 */
export function workerPerformance(
  valid: readonly InsightSale[],
  voidedBySeller: ReadonlyMap<string, number>,
  timeZone: string,
): WorkerPerformance[] {
  const grand = addMoney(...valid.map((s) => s.totalMinor));
  const groups = new Map<string, InsightSale[]>();
  for (const sale of valid)
    groups.set(sale.createdBy, [...(groups.get(sale.createdBy) ?? []), sale]);
  for (const uid of voidedBySeller.keys()) if (!groups.has(uid)) groups.set(uid, []);
  return [...groups]
    .map(([uid, sales]) => {
      const total = addMoney(...sales.map((s) => s.totalMinor));
      const units = sales.reduce(
        (sum, s) => sum + s.lines.reduce((n, l) => n + (l.voided ? 0 : l.quantity), 0),
        0,
      );
      const hours = new Map<number, number>();
      for (const s of sales) {
        const hour = hourInZone(s.occurredAt, timeZone);
        hours.set(hour, (hours.get(hour) ?? 0) + 1);
      }
      const bestHour = [...hours].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null;
      return {
        uid,
        salesCount: sales.length,
        total,
        averageTicket: sales.length ? money(roundDiv(total, sales.length)) : ZERO_MONEY,
        units,
        unitsPerSale: sales.length ? Math.round((units / sales.length) * 10) / 10 : 0,
        voidedCount: voidedBySeller.get(uid) ?? 0,
        creditGiven: addMoney(...sales.map((s) => s.creditMinor)),
        share: grand > 0 ? total / grand : 0,
        bestHour,
      };
    })
    .sort((a, b) => b.total - a.total);
}
