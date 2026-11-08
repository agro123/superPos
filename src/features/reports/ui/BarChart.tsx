import { useState } from 'react';
import { t } from '@/shared/lib/i18n';

export interface BarDatum {
  key: string;
  value: number;
  /** Etiqueta del eje (se muestra cada cierto número de barras). */
  axisLabel: string;
  /** Texto del tooltip y del lector de pantalla. */
  tooltip: string;
  /** Celdas de la tabla accesible, en el orden de `columns`. */
  cells: readonly string[];
}

export interface BarChartProps {
  /** Nombre accesible del gráfico (una serie: sin leyenda, el título la nombra). */
  title: string;
  data: readonly BarDatum[];
  columns: readonly string[];
  /** Máximo de etiquetas visibles en el eje. */
  maxLabels?: number;
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

/** Barras de una sola serie: tooltip por barra (ratón y teclado) y vista de tabla. */
export function BarChart({ title, data, columns, maxLabels = 8 }: BarChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const step = (WIDTH - PAD.left - PAD.right) / Math.max(1, data.length);
  const barWidth = Math.max(2, step - GAP);
  const labelEvery = Math.ceil(data.length / maxLabels);
  const current = active === null ? null : data[active];

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="group"
          aria-label={title}
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
            const height = (d.value / max) * plotHeight;
            const x = PAD.left + index * step + GAP / 2;
            const show = () => {
              setActive(index);
            };
            const hide = () => {
              setActive(null);
            };
            return (
              <g
                key={d.key}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                tabIndex={0}
                role="img"
                aria-label={d.tooltip}
                className="outline-none focus-visible:[&>rect]:stroke-primary"
              >
                <rect
                  x={PAD.left + index * step}
                  y={PAD.top}
                  width={step}
                  height={plotHeight}
                  fill="transparent"
                  strokeWidth={2}
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
                    aria-hidden
                  >
                    {d.axisLabel}
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
            {current.tooltip}
          </p>
        ) : null}
      </div>
      <details className="text-sm">
        <summary className="min-h-touch cursor-pointer content-center text-text-muted">
          {t('reports.asTable')}
        </summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">{title}</caption>
          <thead className="text-xs text-text-muted uppercase">
            <tr>
              {columns.map((column, index) => (
                <th key={column} scope="col" className={index === 0 ? 'py-1' : 'py-1 text-right'}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.key} className="border-t border-border">
                {d.cells.map((cell, index) => (
                  <td
                    key={`${d.key}-${String(index)}`}
                    className={index === 0 ? 'py-1' : 'py-1 text-right tabular-nums'}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
