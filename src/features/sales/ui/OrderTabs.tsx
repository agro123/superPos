import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { cn } from '@/shared/lib/cn';
import { ConfirmDialog, IconButton } from '@/shared/ui';
import { MAX_OPEN_ORDERS, type CartOrder } from '../domain/orders';

export interface OrderTabsProps {
  orders: readonly CartOrder[];
  activeId: string;
  onSelect: (orderId: string) => void;
  onOpen: () => void;
  onClose: (orderId: string) => void;
}

const itemsOf = (order: CartOrder) => order.lines.reduce((sum, line) => sum + line.quantity, 0);

/** Pestañas de órdenes simultáneas del POS; cerrar una orden con productos pide confirmación. */
export function OrderTabs({ orders, activeId, onSelect, onOpen, onClose }: OrderTabsProps) {
  const [pendingClose, setPendingClose] = useState<CartOrder | null>(null);
  const requestClose = (order: CartOrder) => {
    if (order.lines.length > 0) setPendingClose(order);
    else onClose(order.id);
  };
  const closable = orders.length > 1 || orders.some((order) => order.lines.length > 0);

  return (
    <div className="flex items-center gap-1 border-b border-border">
      <div
        role="tablist"
        aria-label={t('pos.orders')}
        className="flex flex-1 gap-1 overflow-x-auto"
      >
        {orders.map((order) => {
          const active = order.id === activeId;
          const label = t('pos.order', { number: formatNumber(order.number) });
          const count = itemsOf(order);
          return (
            <div
              key={order.id || order.number}
              className={cn(
                'flex shrink-0 items-center border-b-2 border-transparent',
                active && 'border-primary',
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  onSelect(order.id);
                }}
                className={cn(
                  'min-h-touch px-3 text-sm font-medium whitespace-nowrap text-text-muted hover:text-text',
                  active && 'text-primary',
                )}
              >
                {label}
                {count > 0 ? ` (${formatNumber(count)})` : ''}
              </button>
              {closable ? (
                <IconButton
                  label={t('pos.closeOrder', { name: label })}
                  icon={<X />}
                  onClick={() => {
                    requestClose(order);
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <IconButton
        label={t('pos.newOrder')}
        icon={<Plus />}
        disabled={orders.length >= MAX_OPEN_ORDERS}
        onClick={onOpen}
      />
      <ConfirmDialog
        open={pendingClose !== null}
        onOpenChange={(open) => {
          if (!open) setPendingClose(null);
        }}
        title={t('pos.closeOrderConfirm')}
        description={t('pos.closeOrderHint')}
        confirmLabel={t('pos.closeOrderAction')}
        tone="danger"
        onConfirm={() => {
          if (pendingClose) onClose(pendingClose.id);
          setPendingClose(null);
        }}
      />
    </div>
  );
}
