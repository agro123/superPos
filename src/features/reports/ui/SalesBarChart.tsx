import { useState } from 'react';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatDate, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import type { DailyTotal } from '../domain/salesSummary';

export interface SalesBarChartProps {
  data: readonly DailyTotal[];
  currency: CurrencyCode;
  timeZone: string;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 8 };
const GAP = 2;
const RADIUS = 4;

/** Barra con esquinas superiores redondeadas y base recta, anclada a la línea base. */
function barPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(RADIUS, width / 2, height);
  const bottom = y + height;
  return `M${x},${bottom}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${bottom}Z`;
}

/** Ventas por día: una sola serie (sin leyenda; el título la nombra), tooltip por barra y tabla accesible. */
export function SalesBarChart({ data, currency, timeZone }: SalesBarChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.total));
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const step = (WIDTH - PAD.left - PAD.right) / Math.max(1, data.length);
  const barWidth = Math.max(2, step - GAP);
  const labelEvery = Math.ceil(data.length / 8);
  const describe = (d: DailyTotal) =>
    t('reports.tooltip', {
      day: formatDate(d.day, timeZone),
      total: formatMoney(d.total, currency),
      count: formatNumber(d.count),
    });
  const current = active === null ? null : data[active];

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={t('reports.byDay')}
        >
          {[0.5, 1].map((ratio) => (
            <line
              key={ratio}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={PAD.top + plotHeight * (1 - ratio)}
              y2={PAD.top + plotHeight * (1 - ratio)}
              className="stroke-border"
              strokeDasharray="2 4"
            />
          ))}
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + plotHeight}
            y2={PAD.top + plotHeight}
            className="stroke-border-strong"
          />
          {data.map((d, index) => {
            const height = (d.total / max) * plotHeight;
            const x = PAD.left + index * step + GAP / 2;
            return (
              <g
                key={d.day.toISOString()}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onMouseLeave={() => {
                  setActive(null);
                }}
              >
                <rect
                  x={PAD.left + index * step}
                  y={PAD.top}
                  width={step}
                  height={plotHeight}
                  fill="transparent"
                />
                {height > 0 ? (
                  <path
                    d={barPath(x, PAD.top + plotHeight - height, barWidth, height)}
                    className={active === index ? 'fill-primary-hover' : 'fill-chart-1'}
                  />
                ) : null}
                {index % labelEvery === 0 ? (
                  <text
                    x={x + barWidth / 2}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-text-subtle text-xs"
                  >
                    {formatDate(d.day, timeZone)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {current ? (
          <p
            role="status"
            className="pointer-events-none absolute top-0 right-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text shadow-md"
          >
            {describe(current)}
          </p>
        ) : null}
      </div>
      <details className="text-sm">
        <summary className="min-h-touch cursor-pointer content-center text-text-muted">
          {t('reports.asTable')}
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{t('reports.byDay')}</caption>
          <thead className="text-xs text-text-muted uppercase">
            <tr>
              <th scope="col" className="py-1">
                {t('reports.day')}
              </th>
              <th scope="col" className="py-1 text-right">
                {t('common.total')}
              </th>
              <th scope="col" className="py-1 text-right">
                {t('reports.count')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day.toISOString()} className="border-t border-border">
                <td className="py-1">{formatDate(d.day, timeZone)}</td>
                <td className="py-1 text-right tabular-nums">{formatMoney(d.total, currency)}</td>
                <td className="py-1 text-right tabular-nums">{formatNumber(d.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
