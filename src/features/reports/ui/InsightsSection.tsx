import { Download } from 'lucide-react';
import { useMemo } from 'react';
import type { CurrencyCode, Money } from '@/shared/domain/money';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, Text } from '@/shared/ui';
import { paymentMix, salesByHour, salesCsv, type InsightSale } from '../domain/insights';
import { BarChart } from './BarChart';

export interface InsightsSectionProps {
  sales: readonly InsightSale[];
  currency: CurrencyCode;
  timeZone: string;
  days: number;
  workerName: (uid: string) => string;
}

const percent = (value: number) => `${String(Math.round(value * 100))} %`;

/** Para decidir: cuándo se vende, cómo pagan y exportar las ventas. */
export function InsightsSection({
  sales,
  currency,
  timeZone,
  days,
  workerName,
}: InsightsSectionProps) {
  const money = (amount: Money) => formatMoney(amount, currency);
  const hours = useMemo(() => salesByHour(sales, timeZone), [sales, timeZone]);
  const mix = useMemo(() => paymentMix(sales), [sales]);
  const peak = hours.reduce(
    (best, h) => (h.total > best.total ? h : best),
    hours[0] ?? { hour: 0, total: 0, count: 0 },
  );
  const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

  const download = () => {
    const csv = salesCsv(sales, currency, (d) => formatDateTime(d, timeZone), workerName);
    // BOM: Excel reconoce las tildes en UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas-${String(days)}-dias.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-text">{t('reports.insights')}</h2>
        <Button
          variant="outline"
          leftIcon={<Download aria-hidden className="size-5" />}
          disabled={sales.length === 0}
          onClick={download}
        >
          {t('reports.exportCsv')}
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section
          aria-labelledby="by-hour"
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
        >
          <h3 id="by-hour" className="text-base font-semibold text-text">
            {t('reports.byHour')}
          </h3>
          {peak.total > 0 ? (
            <Text variant="muted">
              {t('reports.peakHour', {
                from: hourLabel(peak.hour),
                to: hourLabel((peak.hour + 1) % 24),
              })}
            </Text>
          ) : null}
          <BarChart
            title={t('reports.byHour')}
            columns={[t('reports.hour'), t('common.total'), t('reports.count')]}
            maxLabels={12}
            data={hours.map((h) => ({
              key: String(h.hour),
              value: h.total,
              axisLabel: `${String(h.hour)}h`,
              tooltip: t('reports.hourTooltip', {
                hour: hourLabel(h.hour),
                total: money(h.total),
                count: formatNumber(h.count),
              }),
              cells: [hourLabel(h.hour), money(h.total), formatNumber(h.count)],
            }))}
          />
        </section>
        <section
          aria-labelledby="payment-mix"
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <h3 id="payment-mix" className="text-base font-semibold text-text">
            {t('reports.paymentMix')}
          </h3>
          <ul className="flex flex-col gap-3">
            {mix.map((m) => (
              <li key={m.method} className="flex flex-col gap-1 text-sm">
                <span className="flex justify-between gap-2">
                  <span className="text-text">{t(`payment.${m.method}`)}</span>
                  <span className="text-text-muted tabular-nums">{`${money(m.total)} · ${percent(m.share)}`}</span>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-chart-1"
                    style={{ width: percent(m.share).replace(' ', '') }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
