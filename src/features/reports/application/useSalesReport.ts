import { useMemo, useState } from 'react';
import { useSalesSince } from '@/features/sales';
import { salesByDay, summarizeSales, topProducts, type ReportSale } from '../domain/salesSummary';

/** Agregados de ventas (sin anuladas) para dashboard y reportes. */
export function useSalesReport(businessId: string, timeZone: string, days: number) {
  const { query, sales, voided } = useSalesSince(businessId, days);
  const [now] = useState(() => Date.now());
  const report = useMemo(() => {
    const valid: ReportSale[] = sales.filter((sale) => !voided.has(sale.id));
    const from = new Date(now - (days - 1) * 86_400_000);
    return {
      sales: valid,
      summary: summarizeSales(valid),
      byDay: salesByDay(valid, timeZone, from, days),
      top: topProducts(valid, 5),
    };
  }, [sales, voided, timeZone, days, now]);
  return { query, ...report };
}
