import { UsersRound } from 'lucide-react';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { DataTable, EmptyState, type DataTableColumn } from '@/shared/ui';
import type { WorkerPerformance } from '../domain/performance';

export interface PerformanceSectionProps {
  rows: readonly WorkerPerformance[];
  currency: CurrencyCode;
  loading: boolean;
  workerName: (uid: string) => string;
}

/** Desempeño por trabajador: ventas, ticket, canasta, anulaciones, fiado y mejor hora. */
export function PerformanceSection({
  rows,
  currency,
  loading,
  workerName,
}: PerformanceSectionProps) {
  const money = (amount: Parameters<typeof formatMoney>[0]) => formatMoney(amount, currency);
  const columns: DataTableColumn<WorkerPerformance>[] = [
    {
      id: 'worker',
      header: t('cash.col.worker'),
      cell: (r) => workerName(r.uid),
      sortValue: (r) => workerName(r.uid),
    },
    {
      id: 'count',
      header: t('reports.count'),
      align: 'right',
      cell: (r) => formatNumber(r.salesCount),
      sortValue: (r) => r.salesCount,
    },
    {
      id: 'total',
      header: t('common.total'),
      align: 'right',
      cell: (r) => money(r.total),
      sortValue: (r) => r.total,
    },
    {
      id: 'share',
      header: '%',
      align: 'right',
      hideOnMobile: true,
      cell: (r) => `${String(Math.round(r.share * 100))} %`,
    },
    {
      id: 'avg',
      header: t('reports.average'),
      align: 'right',
      cell: (r) => money(r.averageTicket),
      sortValue: (r) => r.averageTicket,
    },
    {
      id: 'basket',
      header: t('reports.perf.unitsPerSale'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => formatNumber(r.unitsPerSale),
    },
    {
      id: 'voided',
      header: t('reports.perf.voided'),
      align: 'right',
      cell: (r) => formatNumber(r.voidedCount),
      sortValue: (r) => r.voidedCount,
    },
    {
      id: 'credit',
      header: t('reports.perf.credit'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => money(r.creditGiven),
    },
    {
      id: 'hour',
      header: t('reports.perf.bestHour'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => (r.bestHour === null ? '—' : `${String(r.bestHour).padStart(2, '0')}:00`),
    },
  ];
  return (
    <section aria-labelledby="performance" className="flex flex-col gap-3">
      <div>
        <h2 id="performance" className="text-lg font-semibold text-text">
          {t('reports.perf.title')}
        </h2>
        <p className="text-sm text-text-muted">{t('reports.perf.description')}</p>
      </div>
      <DataTable
        caption={t('reports.perf.title')}
        columns={columns}
        rows={rows}
        getRowId={(r) => r.uid}
        loading={loading}
        emptyState={<EmptyState icon={<UsersRound />} title={t('reports.noData')} />}
      />
    </section>
  );
}
