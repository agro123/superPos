import { Clock, Users } from 'lucide-react';
import type { CurrencyCode } from '@/shared/domain/money';
import { cn } from '@/shared/lib/cn';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { minutesSince, orderTotal, type RestaurantOrder } from '../domain/order';
import type { Table } from '../domain/restaurant';

export interface TableCardProps {
  table: Table;
  order: RestaurantOrder | null;
  currency: CurrencyCode;
  now: Date;
  onOpen: () => void;
}

const STATUS_CLASS = {
  free: 'border-success bg-success-soft text-success-soft-fg',
  occupied: 'border-danger bg-danger-soft text-danger-soft-fg',
  reserved: 'border-warning bg-warning-soft text-warning-soft-fg',
} as const;

/** Mesa del tablero: estado (color + texto), comensales, tiempo y total de su comanda. */
export function TableCard({ table, order, currency, now, onOpen }: TableCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex min-h-28 w-full flex-col gap-1 rounded-lg border-2 p-3 text-left shadow-sm transition-shadow hover:shadow-md',
        STATUS_CLASS[table.status],
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">{table.name}</span>
        <span className="text-xs font-medium">{t(`restaurant.status.${table.status}`)}</span>
      </span>
      <span className="flex items-center gap-1 text-xs">
        <Users aria-hidden className="size-3.5" />
        {t('restaurant.seats', { count: formatNumber(order?.guests ?? table.seats) })}
      </span>
      {order ? (
        <>
          <span className="flex items-center gap-1 text-xs">
            <Clock aria-hidden className="size-3.5" />
            {t('restaurant.minutes', { count: formatNumber(minutesSince(order.openedAt, now)) })}
            {' · '}
            {t(`restaurant.order.${order.status}`)}
          </span>
          <span className="mt-auto text-base font-semibold tabular-nums">
            {formatMoney(orderTotal(order.lines), currency)}
          </span>
        </>
      ) : null}
    </button>
  );
}
