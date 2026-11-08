import type { CurrencyCode } from '@/shared/domain/money';
import { formatDate, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import type { DailyTotal } from '../domain/salesSummary';
import { BarChart } from './BarChart';

export interface SalesBarChartProps {
  data: readonly DailyTotal[];
  currency: CurrencyCode;
  timeZone: string;
}

/** Ventas por día. */
export function SalesBarChart({ data, currency, timeZone }: SalesBarChartProps) {
  return (
    <BarChart
      title={t('reports.byDay')}
      columns={[t('reports.day'), t('common.total'), t('reports.count')]}
      data={data.map((d) => ({
        key: d.day.toISOString(),
        value: d.total,
        axisLabel: formatDate(d.day, timeZone),
        tooltip: t('reports.tooltip', {
          day: formatDate(d.day, timeZone),
          total: formatMoney(d.total, currency),
          count: formatNumber(d.count),
        }),
        cells: [formatDate(d.day, timeZone), formatMoney(d.total, currency), formatNumber(d.count)],
      }))}
    />
  );
}
