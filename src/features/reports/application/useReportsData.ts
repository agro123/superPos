import { useMemo } from 'react';
import { useCashPeriod } from '@/features/cash';
import { useCategories, useProducts } from '@/features/catalog';
import { useAdjustmentsSince } from '@/features/inventory';
import { paymentMix, salesByHour } from '../domain/insights';
import { workerPerformance } from '../domain/performance';
import { profitReport } from '../domain/profit';
import { useSalesReport } from './useSalesReport';

/** Todo lo que muestran (y exportan) los reportes del periodo. */
export function useReportsData(businessId: string, timeZone: string, days: number) {
  const report = useSalesReport(businessId, timeZone, days);
  const products = useProducts(businessId);
  const categories = useCategories(businessId);
  const cash = useCashPeriod(businessId, days);
  const inventory = useAdjustmentsSince(businessId, days);

  const productList = products.data;
  const categoryList = categories.data;
  const derived = useMemo(() => {
    const product = (id: string) => productList?.find((p) => p.id === id);
    const voidedBySeller = new Map<string, number>();
    for (const sale of report.allSales) {
      if (report.voided.has(sale.id))
        voidedBySeller.set(sale.createdBy, (voidedBySeller.get(sale.createdBy) ?? 0) + 1);
    }
    return {
      hours: salesByHour(report.sales, timeZone),
      mix: paymentMix(report.sales),
      performance: workerPerformance(report.sales, voidedBySeller, timeZone),
      profit: profitReport({
        sales: report.sales,
        currentCost: (id) => product(id)?.costMinor ?? null,
        categoryOf: (id) => {
          const categoryId = product(id)?.categoryId;
          return categoryList?.find((c) => c.id === categoryId)?.name ?? null;
        },
        expenses: cash.expenses,
        adjustments: inventory.adjustments,
      }),
    };
  }, [
    report.sales,
    report.allSales,
    report.voided,
    productList,
    categoryList,
    cash.expenses,
    inventory.adjustments,
    timeZone,
  ]);

  return {
    ...report,
    ...derived,
    cashRows: cash.rows,
    workerName: cash.workerName,
    loading: report.query.isPending || products.isPending || cash.loading || inventory.loading,
  };
}
