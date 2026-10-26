import type { ReactNode } from 'react';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatDateTime, formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, Text } from '@/shared/ui';
import type { CashShift } from '../domain/cashShift';

export interface CurrentShiftPanelProps {
  shift: CashShift;
  timezone: string;
  currency: CurrencyCode;
  actions: ReactNode;
  /** Resumen del turno. */
  children: ReactNode;
}

/** Turno en curso de este dispositivo: estado, base, acciones y resumen. */
export function CurrentShiftPanel({
  shift,
  timezone,
  currency,
  actions,
  children,
}: CurrentShiftPanelProps) {
  return (
    <section
      aria-labelledby="current-shift"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-muted p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2
            id="current-shift"
            className="flex items-center gap-2 text-lg font-semibold text-text"
          >
            {t('cash.openState', { time: formatDateTime(shift.openedAt, timezone) })}
            <Badge tone={shift.status === 'open' ? 'success' : 'warning'}>
              {t(`cash.status.${shift.status}`)}
            </Badge>
          </h2>
          <Text variant="muted">
            {t('cash.openingFloat')}: {formatMoney(shift.openingFloatMinor, currency)}
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      {children}
    </section>
  );
}
