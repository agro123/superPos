import { addMoney, type CurrencyCode, type Money } from '@/shared/domain/money';
import type { PaymentMethod } from '@/shared/domain/payment';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { cn } from '@/shared/lib/cn';
import type { ShiftSummary } from '../domain/cashShift';

export interface ShiftSummaryViewProps {
  summary: ShiftSummary;
  openingFloat: Money;
  currency: CurrencyCode;
  /** Métodos de pago habilitados en el negocio (además del efectivo). */
  methods: readonly PaymentMethod[];
}

interface Row {
  label: string;
  value: Money;
  sign?: '+' | '−';
  emphasis?: boolean;
}

function Rows({ title, rows, currency }: { title: string; rows: Row[]; currency: CurrencyCode }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-muted">{title}</h3>
      <dl className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              'flex items-baseline justify-between gap-3 text-sm',
              row.emphasis && 'border-t border-border pt-2 text-base font-semibold',
            )}
          >
            <dt className="text-text-muted">{row.label}</dt>
            <dd className="text-text tabular-nums">
              {row.sign ? `${row.sign} ` : ''}
              {formatMoney(row.value, currency)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Resumen del turno: movimientos de efectivo e ingresos por otros medios de pago. */
export function ShiftSummaryView({
  summary,
  openingFloat,
  currency,
  methods,
}: ShiftSummaryViewProps) {
  const others = methods.filter((m) => m !== 'cash');
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        {t('cash.salesCount', { count: formatNumber(summary.salesCount) })}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Rows
          title={t('cash.cashMovements')}
          currency={currency}
          rows={[
            { label: t('cash.openingFloat'), value: openingFloat },
            { label: t('cash.cashIn'), value: summary.cashReceived, sign: '+' },
            { label: t('cash.changeOut'), value: summary.changeGiven, sign: '−' },
            { label: t('cash.expensesOut'), value: summary.expensesTotal, sign: '−' },
            { label: t('cash.expected'), value: summary.expectedCash, emphasis: true },
          ]}
        />
        <Rows
          title={t('cash.incomeByMethod')}
          currency={currency}
          rows={[
            ...others.map((m) => ({ label: t(`payment.${m}`), value: summary.byMethod[m] })),
            { label: t('cash.netCash'), value: summary.byMethod.cash },
            {
              label: t('cash.totalIncome'),
              value: addMoney(...Object.values(summary.byMethod)),
              emphasis: true,
            },
          ]}
        />
      </div>
    </div>
  );
}
