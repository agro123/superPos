import {
  money as toMoney,
  subtractMoney,
  type CurrencyCode,
  type Money,
} from '@/shared/domain/money';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import type { CashShift, ShiftSummary } from '../domain/cashShift';

/** Resumen del turno en texto, para enviarlo al dueño por WhatsApp o correo. */
export function shiftReportText(
  shift: CashShift,
  summary: ShiftSummary,
  workerName: (uid: string) => string,
  currency: CurrencyCode,
  timeZone: string,
): string {
  const money = (amount: Money) => formatMoney(amount, currency);
  const difference =
    shift.countedCashMinor !== null && shift.expectedCashMinor !== null
      ? subtractMoney(shift.countedCashMinor, shift.expectedCashMinor)
      : null;
  return [
    t('cash.report.textTitle', { device: shift.deviceCode }),
    t('cash.report.textOpened', {
      time: formatDateTime(shift.openedAt, timeZone),
      name: workerName(shift.openedBy),
    }),
    ...(shift.closedAt && shift.closedBy
      ? [
          t('cash.report.textClosed', {
            time: formatDateTime(shift.closedAt, timeZone),
            name: workerName(shift.closedBy),
          }),
        ]
      : [t('cash.report.textStillOpen')]),
    '',
    t('cash.salesCount', { count: formatNumber(summary.salesCount) }),
    `${t('cash.openingFloat')}: ${money(shift.openingFloatMinor)}`,
    `${t('cash.cashIn')}: ${money(summary.cashReceived)}`,
    `${t('cash.changeOut')}: ${money(summary.changeGiven)}`,
    `${t('cash.expensesOut')}: ${money(summary.expensesTotal)}`,
    `${t('cash.expected')}: ${money(summary.expectedCash)}`,
    ...(shift.countedCashMinor !== null
      ? [`${t('cash.counted')}: ${money(shift.countedCashMinor)}`]
      : []),
    ...(difference !== null
      ? [
          `${t('cash.col.difference')}: ${difference < 0 ? '−' : ''}${money(toMoney(Math.abs(difference)))}`,
        ]
      : []),
    '',
    ...(['card', 'transfer', 'wallet', 'other', 'credit'] as const)
      .filter((m) => summary.byMethod[m] > 0)
      .map((m) => `${t(`payment.${m}`)}: ${money(summary.byMethod[m])}`),
    ...(shift.notes ? ['', `${t('common.notes')}: ${shift.notes}`] : []),
  ].join('\n');
}
