import { ChefHat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { restaurantWrites, useActiveOrders } from '../application/useRestaurant';
import { minutesSince } from '../domain/order';

/** Pantalla de cocina: comandas enviadas (la ronda actual resaltada), de la más antigua a la nueva. */
export default function KitchenPage() {
  const { business } = useActiveBusiness();
  const orders = useActiveOrders(business.id);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  const queue = (orders.data ?? [])
    .filter((o) => o.status === 'sent')
    .sort((a, b) => (a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t('restaurant.kitchen')} description={t('restaurant.kitchenHint')} />
      {orders.error ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(orders.error)}
        />
      ) : orders.isPending ? (
        <Skeleton className="h-64" />
      ) : queue.length === 0 ? (
        <EmptyState icon={<ChefHat />} title={t('restaurant.kitchenEmpty')} />
      ) : (
        <ul
          aria-label={t('restaurant.kitchen')}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {queue.map((order) => {
            const minutes = order.sentAt ? minutesSince(order.sentAt, now) : 0;
            return (
              <li
                key={order.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-text">{order.tableName}</h2>
                  <Badge tone={minutes >= 20 ? 'danger' : minutes >= 10 ? 'warning' : 'info'}>
                    {t('restaurant.minutes', { count: formatNumber(minutes) })}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted">
                  {t('restaurant.round', { round: String(order.round) })}
                </p>
                <ul className="flex flex-col gap-1">
                  {order.lines
                    .filter((l) => l.round > 0)
                    .map((l) => (
                      <li
                        key={l.id}
                        className={
                          l.round === order.round
                            ? 'text-base font-semibold text-text'
                            : 'text-sm text-text-subtle line-through'
                        }
                      >
                        {formatNumber(l.quantity)} × {l.name}
                        {l.notes ? (
                          <span className="block text-sm font-normal text-warning">{l.notes}</span>
                        ) : null}
                      </li>
                    ))}
                </ul>
                <Button
                  className="mt-auto"
                  onClick={() => {
                    restaurantWrites.markOrderServed(business.id, order.id);
                  }}
                >
                  {t('restaurant.ready')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
