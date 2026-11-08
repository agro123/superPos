import { ImageOff } from 'lucide-react';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, QuantityStepper } from '@/shared/ui';
import type { PublicItem } from '../domain/storefront';

export interface PublicProductCardProps {
  item: PublicItem;
  currency: CurrencyCode;
  quantity: number;
  /** `false` si la tienda no recibe pedidos por WhatsApp. */
  canOrder: boolean;
  onQuantityChange: (quantity: number) => void;
}

/** Producto del catálogo público: foto, nombre, precio y cantidad para el pedido. */
export function PublicProductCard({
  item,
  currency,
  quantity,
  canOrder,
  onQuantityChange,
}: PublicProductCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex aspect-[4/3] items-center justify-center bg-surface-muted text-text-subtle">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <ImageOff aria-hidden className="size-6" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-text">{item.name}</h3>
        <p className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-text tabular-nums">
            {formatMoney(item.priceMinor, currency)}
          </span>
          {item.available ? null : <Badge tone="danger">{t('ui.product.outOfStock')}</Badge>}
        </p>
        {canOrder && item.available ? (
          quantity > 0 ? (
            <QuantityStepper
              value={quantity}
              onValueChange={onQuantityChange}
              itemName={item.name}
              min={0}
              max={99}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onQuantityChange(1);
              }}
            >
              {t('storefront.add')}
            </Button>
          )
        ) : null}
      </div>
    </article>
  );
}
