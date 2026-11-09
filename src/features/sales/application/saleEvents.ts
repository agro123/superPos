import type { Money } from '@/shared/domain/money';
import type { RestaurantLink } from '../domain/orders';
import { useCartStore } from './cartStore';

/** Venta recién registrada que cobró una comanda de restaurante. */
export interface RestaurantSalePaid {
  businessId: string;
  saleId: string;
  uid: string;
  restaurant: RestaurantLink;
}

type Handler = (event: RestaurantSalePaid) => void;
const handlers = new Set<Handler>();

/**
 * Otra feature (restaurant) se entera de que su comanda se cobró sin que `sales` dependa de ella:
 * el handler lo registra `app/` al arrancar, como los del outbox.
 */
export function onRestaurantSalePaid(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function notifyRestaurantSalePaid(event: RestaurantSalePaid): void {
  for (const handler of handlers) handler(event);
}

export interface RestaurantCartLine {
  productId: string;
  name: string;
  unitPriceMinor: Money;
  taxRateBps: number;
  quantity: number;
}

/** Abre (o actualiza) una orden del carrito con las líneas de la comanda, para cobrarla en el POS. */
export function loadRestaurantOrderIntoCart(
  businessId: string,
  link: RestaurantLink,
  lines: readonly RestaurantCartLine[],
): void {
  useCartStore.getState().loadRestaurantOrder(
    businessId,
    link,
    lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      unitPrice: line.unitPriceMinor,
      taxRateBps: line.taxRateBps,
      quantity: line.quantity,
    })),
  );
}
