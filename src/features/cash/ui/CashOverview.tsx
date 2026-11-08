import { Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { money as toMoney, subtractMoney, type CurrencyCode } from '@/shared/domain/money';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, EmptyState, Skeleton } from '@/shared/ui';
import { useRecentShifts, useShiftsActivity } from '../application/useCash';
import { useWorkerNames } from '../application/useWorkerNames';
import { summarizeShift } from '../domain/cashShift';

export interface CashOverviewProps {
  businessId: string;
  currency: CurrencyCode;
  timezone: string;
  /** Cuántos cierres recientes mostrar. */
  closedLimit?: number;
}

/**
 * Todas las cajas del negocio en tiempo real (para el dueño, también desde fuera del local): turnos
 * abiertos de cada dispositivo con lo vendido y el efectivo esperado, y los últimos cierres.
 */
export function CashOverview({
  businessId,
  currency,
  timezone,
  closedLimit = 3,
}: CashOverviewProps) {
  const shifts = useRecentShifts(businessId);
  const open = useMemo(
    () => (shifts.data ?? []).filter((s) => s.status !== 'closed'),
    [shifts.data],
  );
  const closed = (shifts.data ?? []).filter((s) => s.status === 'closed').slice(0, closedLimit);
  const live = useShiftsActivity(businessId, open);
  const workerName = useWorkerNames(businessId);
  const money = (amount: Parameters<typeof formatMoney>[0]) => formatMoney(amount, currency);
  if (shifts.isPending) return <Skeleton className="h-32" />;

  return (
    <div className="flex flex-col gap-3">
      {open.length === 0 ? (
        <EmptyState icon={<Wallet />} title={t('cash.overview.noneOpen')} />
      ) : (
        <ul aria-label={t('cash.overview.open')} className="grid gap-3 md:grid-cols-2">
          {open.map((shift) => {
            const activity = live.activity.find((a) => a.shift.id === shift.id);
            const summary = activity
              ? summarizeShift(
                  shift.openingFloatMinor,
                  activity.sales,
                  activity.expenses.map((e) => e.amountMinor),
                  activity.creditPayments,
                )
              : null;
            return (
              <li
                key={shift.id}
                className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3 text-sm"
              >
                <span className="flex items-center justify-between gap-2">
                  <strong className="text-text">
                    {t('cash.overview.device', { code: shift.deviceCode })}
                  </strong>
                  <Badge tone={shift.status === 'open' ? 'success' : 'warning'}>
                    {t(`cash.status.${shift.status}`)}
                  </Badge>
                </span>
                <span className="text-text-muted">
                  {t('cash.overview.openedBy', {
                    name: workerName(shift.openedBy),
                    time: formatDateTime(shift.openedAt, timezone),
                  })}
                </span>
                {summary ? (
                  <span className="flex flex-wrap gap-x-4 text-text">
                    <span>
                      {t('cash.overview.sales', { count: formatNumber(summary.salesCount) })}
                    </span>
                    <span>{`${t('cash.expected')}: ${money(summary.expectedCash)}`}</span>
                  </span>
                ) : (
                  <Skeleton className="h-4 w-40" />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {closed.length > 0 ? (
        <ul
          aria-label={t('cash.overview.closed')}
          className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface"
        >
          {closed.map((shift) => {
            const diff =
              shift.countedCashMinor !== null && shift.expectedCashMinor !== null
                ? subtractMoney(shift.countedCashMinor, shift.expectedCashMinor)
                : null;
            return (
              <li
                key={shift.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="text-text">
                  {t('cash.overview.closedLine', {
                    device: shift.deviceCode,
                    time: shift.closedAt ? formatDateTime(shift.closedAt, timezone) : '—',
                    name: shift.closedBy ? workerName(shift.closedBy) : '—',
                  })}
                </span>
                {diff === null ? null : (
                  <Badge tone={diff === 0 ? 'success' : 'danger'}>
                    {diff === 0
                      ? t('cash.balanced')
                      : t(diff < 0 ? 'cash.shortage' : 'cash.surplus', {
                          amount: money(toMoney(Math.abs(diff))),
                        })}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      <Link to="/cash" className="self-start text-sm font-medium text-primary hover:underline">
        {t('cash.overview.goToCash')}
      </Link>
    </div>
  );
}
