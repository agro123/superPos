import { BarChart3 } from 'lucide-react';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { EmptyState, Skeleton, StatCard } from '@/shared/ui';
import type { useSalesReport } from '../application/useSalesReport';
import { SalesBarChart } from './SalesBarChart';

export interface SalesOverviewProps {
  report: ReturnType<typeof useSalesReport>;
  loading: boolean;
  currency: CurrencyCode;
  timeZone: string;
}

/** Totales, ventas por día y productos más vendidos del periodo. */
export function SalesOverview({ report, loading, currency, timeZone }: SalesOverviewProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t('reports.total')}
          value={formatMoney(report.summary.total, currency)}
          loading={loading}
        />
        <StatCard
          label={t('reports.count')}
          value={formatNumber(report.summary.count)}
          loading={loading}
        />
        <StatCard
          label={t('reports.average')}
          value={formatMoney(report.summary.averageTicket, currency)}
          loading={loading}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section
          aria-labelledby="by-day"
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
        >
          <h2 id="by-day" className="text-base font-semibold text-text">
            {t('reports.byDay')}
          </h2>
          <p className="text-xs text-text-subtle">{t('reports.byDayHint')}</p>
          {loading ? (
            <Skeleton className="h-52" />
          ) : report.summary.count === 0 ? (
            <EmptyState icon={<BarChart3 />} title={t('reports.noData')} />
          ) : (
            <SalesBarChart data={report.byDay} currency={currency} timeZone={timeZone} />
          )}
        </section>
        <section
          aria-labelledby="top-products"
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
        >
          <h2 id="top-products" className="text-base font-semibold text-text">
            {t('reports.topProducts')}
          </h2>
          {loading ? (
            <Skeleton className="h-40" />
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {report.top.map((product, index) => (
                <li
                  key={product.productId}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="text-text">
                    <span className="mr-2 text-text-subtle">{index + 1}.</span>
                    {product.name}
                  </span>
                  <span className="text-text-muted tabular-nums">
                    {t('reports.units', { count: formatNumber(product.quantity) })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
