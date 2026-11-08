import { TrendingDown } from 'lucide-react';
import { money as toMoney, type CurrencyCode } from '@/shared/domain/money';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, DataTable, EmptyState, StatCard, Text, type DataTableColumn } from '@/shared/ui';
import type { ProfitLine, ProfitReport } from '../domain/profit';

export interface ProfitSectionProps {
  report: ProfitReport;
  currency: CurrencyCode;
  loading: boolean;
}

const percent = (value: number) => `${String(Math.round(value * 1000) / 10)} %`;

/** Dónde gana o pierde el negocio: resultado, margen por producto y categoría, pérdidas. */
export function ProfitSection({ report, currency, loading }: ProfitSectionProps) {
  const money = (value: number) => {
    const text = formatMoney(toMoney(Math.abs(Math.round(value))), currency);
    return value < 0 ? `− ${text}` : text;
  };
  const columns = (label: string): DataTableColumn<ProfitLine>[] => [
    { id: 'name', header: label, cell: (l) => l.name, sortValue: (l) => l.name },
    {
      id: 'qty',
      header: t('reports.sheet.units'),
      align: 'right',
      hideOnMobile: true,
      cell: (l) => formatNumber(l.quantity),
    },
    {
      id: 'revenue',
      header: t('reports.profit.revenue'),
      align: 'right',
      cell: (l) => money(l.revenue),
      sortValue: (l) => l.revenue,
    },
    {
      id: 'cost',
      header: t('reports.profit.cost'),
      align: 'right',
      hideOnMobile: true,
      cell: (l) => money(l.cost),
    },
    {
      id: 'margin',
      header: t('reports.profit.margin'),
      align: 'right',
      sortValue: (l) => l.margin,
      cell: (l) =>
        l.margin < 0 ? <Badge tone="danger">{money(l.margin)}</Badge> : money(l.margin),
    },
    {
      id: 'pct',
      header: '%',
      align: 'right',
      cell: (l) => (l.revenue > 0 ? percent(l.margin / l.revenue) : '—'),
      sortValue: (l) => (l.revenue > 0 ? l.margin / l.revenue : 0),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Text variant="caption">
        {t('reports.profit.hint', { coverage: percent(report.coverage) })}
      </Text>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('reports.profit.grossMargin')}
          value={money(report.grossMargin)}
          loading={loading}
        />
        <StatCard
          label={t('reports.profit.expenses')}
          value={money(-Number(report.expenses))}
          loading={loading}
        />
        <StatCard
          label={t('reports.profit.shrinkage')}
          value={money(-Number(report.shrinkage))}
          loading={loading}
        />
        <StatCard
          label={t('reports.profit.result')}
          value={money(report.result)}
          loading={loading}
        />
      </div>
      {report.losing.length > 0 ? (
        <section
          aria-labelledby="losing"
          className="flex flex-col gap-2 rounded-lg border border-danger bg-danger-soft p-4 text-danger-soft-fg"
        >
          <h3 id="losing" className="flex items-center gap-2 text-base font-semibold">
            <TrendingDown aria-hidden className="size-5" />
            {t('reports.profit.losing')}
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {report.losing.map((l) => (
              <li key={l.key}>
                {t('reports.profit.losingLine', { name: l.name, amount: money(l.margin) })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="by-category" className="flex flex-col gap-2">
        <h3 id="by-category" className="text-base font-semibold text-text">
          {t('reports.profit.byCategory')}
        </h3>
        <DataTable
          caption={t('reports.profit.byCategory')}
          columns={columns(t('reports.profit.category'))}
          rows={report.byCategory}
          getRowId={(l) => l.key}
          loading={loading}
          emptyState={<EmptyState title={t('reports.noCosts')} />}
        />
      </section>
      <section aria-labelledby="by-product" className="flex flex-col gap-2">
        <h3 id="by-product" className="text-base font-semibold text-text">
          {t('reports.profit.byProduct')}
        </h3>
        <DataTable
          caption={t('reports.profit.byProduct')}
          columns={columns(t('inventory.product'))}
          rows={report.byProduct}
          getRowId={(l) => l.key}
          loading={loading}
          searchText={(l) => l.name}
          searchPlaceholder={t('inventory.search')}
          emptyState={<EmptyState title={t('reports.noCosts')} />}
        />
      </section>
      {report.withoutCost.length > 0 ? (
        <Text variant="muted">
          {t('reports.profit.withoutCost', {
            names: report.withoutCost
              .slice(0, 5)
              .map((l) => l.name)
              .join(', '),
            count: formatNumber(report.withoutCost.length),
          })}
        </Text>
      ) : null}
    </div>
  );
}
