import { BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { CashByWorkerReport } from '@/features/cash';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState, PageHeader, Select, Skeleton, StatCard } from '@/shared/ui';
import { useSalesReport } from '../application/useSalesReport';
import { SalesBarChart } from '../ui/SalesBarChart';

const RANGES = [7, 14, 30] as const;

export default function ReportsPage() {
  const { business } = useActiveBusiness();
  const [days, setDays] = useState<number>(14);
  const report = useSalesReport(business.id, business.timezone, days);
  const loading = report.query.isPending;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t('reports.title')} description={t('reports.description')} />
      <div role="group" aria-label={t('reports.filters')} className="flex flex-wrap gap-2">
        <Select
          aria-label={t('reports.range')}
          className="w-56"
          value={String(days)}
          onValueChange={(value) => {
            setDays(Number(value));
          }}
          options={RANGES.map((value) => ({
            value: String(value),
            label: t('common.lastDays', { days: value }),
          }))}
        />
      </div>
      {report.query.isError ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(report.query.error)}
          action={<Button onClick={() => void report.query.refetch()}>{t('common.retry')}</Button>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label={t('reports.total')}
              value={formatMoney(report.summary.total, business.currency)}
              loading={loading}
            />
            <StatCard
              label={t('reports.count')}
              value={formatNumber(report.summary.count)}
              loading={loading}
            />
            <StatCard
              label={t('reports.average')}
              value={formatMoney(report.summary.averageTicket, business.currency)}
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
                <SalesBarChart
                  data={report.byDay}
                  currency={business.currency}
                  timeZone={business.timezone}
                />
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
      )}
      <CashByWorkerReport businessId={business.id} currency={business.currency} days={days} />
    </div>
  );
}
