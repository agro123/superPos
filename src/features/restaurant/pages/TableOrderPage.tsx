import { ChefHat, CreditCard, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { useProducts } from '@/features/catalog';
import { loadRestaurantOrderIntoCart } from '@/features/sales';
import { Can } from '@/features/users';
import { useToast } from '@/shared/hooks/useToast';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  FormField,
  NumberInput,
  PageHeader,
  Skeleton,
} from '@/shared/ui';
import { restaurantWrites, useActiveOrders, useTables } from '../application/useRestaurant';
import { addOrderLine, pendingLines, sendRound, setPendingQuantity } from '../domain/order';
import { OrderLinesPanel } from '../ui/OrderLinesPanel';
import { ProductPicker } from '../ui/ProductPicker';

/** Comanda de una mesa: abrir, tomar el pedido, enviar rondas a cocina, cobrar o cancelar. */
export default function TableOrderPage() {
  const { tableId = '' } = useParams();
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const navigate = useNavigate();
  const tables = useTables(business.id);
  const orders = useActiveOrders(business.id);
  const products = useProducts(business.id);
  const [guests, setGuests] = useState<number | null>(2);
  const [cancelling, setCancelling] = useState(false);
  if (tables.isPending || orders.isPending) return <Skeleton className="m-6 h-96" />;
  const table = tables.data?.find((x) => x.id === tableId);
  if (!table) return <EmptyState title={t('restaurant.tableNotFound')} />;
  const order = orders.data?.find((o) => o.tableId === tableId) ?? null;
  const back = () => void navigate('/restaurant/tables');

  if (!order) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title={table.name}
          description={t(`restaurant.status.${table.status}`)}
          backTo={{ to: '/restaurant/tables', label: t('restaurant.title') }}
        />
        <Can permission="sales.create">
          <form
            className="flex max-w-sm flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!guests) return;
              restaurantWrites.openOrder(business.id, table, guests, user.uid);
            }}
          >
            <FormField label={t('restaurant.guests')}>
              {(control) => (
                <NumberInput
                  {...control}
                  min={1}
                  max={50}
                  value={guests}
                  onValueChange={setGuests}
                />
              )}
            </FormField>
            <Button type="submit" disabled={!guests}>
              {t('restaurant.openTable')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                restaurantWrites.setTableStatus(
                  business.id,
                  table.id,
                  table.status === 'reserved' ? 'free' : 'reserved',
                );
              }}
            >
              {table.status === 'reserved' ? t('restaurant.unreserve') : t('restaurant.reserve')}
            </Button>
          </form>
        </Can>
      </div>
    );
  }

  const pending = pendingLines(order.lines).reduce((n, l) => n + l.quantity, 0);
  const servedRound = order.status === 'served' ? order.round : order.round - 1;
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('restaurant.orderTitle', { table: table.name })}
        description={`${t('restaurant.seats', { count: formatNumber(order.guests) })} · ${t(`restaurant.order.${order.status}`)}`}
        backTo={{ to: '/restaurant/tables', label: t('restaurant.title') }}
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <ProductPicker
          products={products.data ?? []}
          currency={business.currency}
          onPick={(p) => {
            restaurantWrites.saveOrderLines(
              business.id,
              order.id,
              addOrderLine(order.lines, p, crypto.randomUUID()),
            );
          }}
        />
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <OrderLinesPanel
            lines={order.lines}
            currency={business.currency}
            servedRound={servedRound}
            onQuantity={(lineId, q) => {
              restaurantWrites.saveOrderLines(
                business.id,
                order.id,
                setPendingQuantity(order.lines, lineId, q),
              );
            }}
          />
          <Button
            leftIcon={<ChefHat aria-hidden className="size-5" />}
            disabled={pending === 0}
            onClick={() => {
              const next = sendRound(order);
              if (!next) return;
              restaurantWrites.sendOrderRound(business.id, order.id, next.lines, next.round);
              toast({
                title: t('restaurant.sent', { count: formatNumber(pending) }),
                tone: 'success',
              });
            }}
          >
            {t('restaurant.send', { count: formatNumber(pending) })}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<CreditCard aria-hidden className="size-5" />}
            disabled={order.lines.length === 0}
            onClick={() => {
              loadRestaurantOrderIntoCart(
                business.id,
                { orderId: order.id, tableId: table.id, tableName: table.name },
                order.lines,
              );
              void navigate('/pos');
            }}
          >
            {t('restaurant.charge')}
          </Button>
          {order.status !== 'served' ? (
            <Button
              variant="ghost"
              leftIcon={<XCircle aria-hidden className="size-5" />}
              onClick={() => {
                setCancelling(true);
              }}
            >
              {t('restaurant.cancel')}
            </Button>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title={t('restaurant.cancelConfirm', { table: table.name })}
        description={t('restaurant.cancelHint')}
        confirmLabel={t('restaurant.cancel')}
        tone="danger"
        onConfirm={() => {
          restaurantWrites.closeOrder(business.id, order, { status: 'cancelled' });
          setCancelling(false);
          back();
        }}
      />
    </div>
  );
}
