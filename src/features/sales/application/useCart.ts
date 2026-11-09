import { useMemo, useSyncExternalStore } from 'react';
import type { CartLine } from '../domain/cart';
import { toTotalsLines } from '../domain/cart';
import { activeOrder, type CartOrder, type RestaurantLink } from '../domain/orders';
import { calculateTotals, type Totals } from '../domain/totals';
import { useCartStore } from './cartStore';

const EMPTY: CartLine[] = [];
// Antes del primer cambio no hay órdenes guardadas: se muestra la orden 1 vacía.
const NO_ORDERS: CartOrder[] = [{ id: '', number: 1, lines: [] }];

/** `true` cuando el carrito ya se leyó de IndexedDB. */
function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
  );
}

export interface CartView {
  hydrated: boolean;
  /** Órdenes abiertas (pestañas). */
  orders: readonly CartOrder[];
  activeOrderId: string;
  /** Cliente de la orden activa. */
  customerId: string | null;
  /** Comanda de restaurante vinculada a la orden activa. */
  restaurant: RestaurantLink | null;
  /** Líneas de la orden activa. */
  lines: readonly CartLine[];
  totals: Totals;
}

/** Orden activa y sus totales (precios del catálogo, L6; totales puros, L7). */
export function useCart(businessId: string, pricesIncludeTax: boolean): CartView {
  const hydrated = useCartHydrated();
  const book = useCartStore((state) => state.books[businessId]);
  const active = book ? activeOrder(book) : undefined;
  const lines = active?.lines ?? EMPTY;
  const totals = useMemo(
    () => calculateTotals(toTotalsLines(lines), { pricesIncludeTax }),
    [lines, pricesIncludeTax],
  );
  return {
    hydrated,
    orders: book?.orders ?? NO_ORDERS,
    activeOrderId: active?.id ?? '',
    customerId: active?.customerId ?? null,
    restaurant: active?.restaurant ?? null,
    lines,
    totals,
  };
}
