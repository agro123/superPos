import { startOfDayInZone } from '@/shared/domain/dates';
import { addMoney, money, roundDiv, ZERO_MONEY, type Money } from '@/shared/domain/money';

/** Datos mínimos de una venta para reportes. */
export interface ReportSale {
  id: string;
  occurredAt: Date;
  totalMinor: Money;
  lines: readonly { productId: string; name: string; quantity: number; voided: boolean }[];
}

export interface SalesSummary {
  total: Money;
  count: number;
  averageTicket: Money;
}

/** Totales de un conjunto de ventas (ya sin las anuladas). */
export function summarizeSales(sales: readonly ReportSale[]): SalesSummary {
  const total = addMoney(...sales.map((sale) => sale.totalMinor));
  return {
    total,
    count: sales.length,
    averageTicket: sales.length ? money(roundDiv(total, sales.length)) : ZERO_MONEY,
  };
}

export interface DailyTotal {
  /** Inicio del día en la zona horaria del negocio. */
  day: Date;
  total: Money;
  count: number;
}

/** Ventas agrupadas por día en la zona horaria del negocio (L11), incluyendo días sin ventas. */
export function salesByDay(
  sales: readonly ReportSale[],
  timeZone: string,
  from: Date,
  days: number,
): DailyTotal[] {
  const buckets = new Map<number, DailyTotal>();
  let cursor = startOfDayInZone(from, timeZone);
  for (let i = 0; i < days; i += 1) {
    buckets.set(cursor.getTime(), { day: cursor, total: ZERO_MONEY, count: 0 });
    cursor = startOfDayInZone(new Date(cursor.getTime() + 36 * 60 * 60 * 1000), timeZone);
  }
  for (const sale of sales) {
    const bucket = buckets.get(startOfDayInZone(sale.occurredAt, timeZone).getTime());
    if (bucket) {
      bucket.total = addMoney(bucket.total, sale.totalMinor);
      bucket.count += 1;
    }
  }
  return [...buckets.values()];
}

export interface ProductRanking {
  productId: string;
  name: string;
  quantity: number;
}

/** Productos más vendidos por cantidad (sin líneas anuladas). */
export function topProducts(sales: readonly ReportSale[], limit: number): ProductRanking[] {
  const totals = new Map<string, ProductRanking>();
  for (const line of sales.flatMap((sale) => sale.lines)) {
    if (line.voided) continue;
    const current = totals.get(line.productId) ?? {
      productId: line.productId,
      name: line.name,
      quantity: 0,
    };
    totals.set(line.productId, { ...current, quantity: current.quantity + line.quantity });
  }
  return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}
