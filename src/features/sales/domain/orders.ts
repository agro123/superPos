import type { CartLine } from './cart';

/** Orden de compra en curso (una pestaña del carrito). */
export interface CartOrder {
  id: string;
  /** Número visible ("Orden 2"); se reutiliza el menor libre. */
  number: number;
  lines: CartLine[];
}

/** Órdenes abiertas de un negocio y la que está activa. */
export interface OrderBook {
  orders: CartOrder[];
  activeId: string;
}

/** Máximo de órdenes simultáneas: evita pestañas olvidadas que retienen productos. */
export const MAX_OPEN_ORDERS = 8;

export function createOrderBook(id: string, lines: CartLine[] = []): OrderBook {
  return { orders: [{ id, number: 1, lines }], activeId: id };
}

export function activeOrder(book: OrderBook): CartOrder {
  const found = book.orders.find((order) => order.id === book.activeId) ?? book.orders[0];
  if (!found) throw new Error('OrderBook sin órdenes');
  return found;
}

/** Abre una orden vacía y la activa. No hace nada si se alcanzó `MAX_OPEN_ORDERS`. */
export function openOrder(book: OrderBook, id: string): OrderBook {
  if (book.orders.length >= MAX_OPEN_ORDERS) return book;
  const used = new Set(book.orders.map((order) => order.number));
  let number = 1;
  while (used.has(number)) number += 1;
  return { orders: [...book.orders, { id, number, lines: [] }], activeId: id };
}

export function selectOrder(book: OrderBook, id: string): OrderBook {
  return book.orders.some((order) => order.id === id) ? { ...book, activeId: id } : book;
}

/**
 * Cierra una orden. Si era la única, queda una nueva vacía con `replacementId`;
 * si era la activa, se activa la vecina.
 */
export function closeOrder(book: OrderBook, id: string, replacementId: string): OrderBook {
  const index = book.orders.findIndex((order) => order.id === id);
  if (index === -1) return book;
  const orders = book.orders.filter((order) => order.id !== id);
  const neighbor = orders[Math.min(index, orders.length - 1)];
  if (!neighbor) return createOrderBook(replacementId);
  return { orders, activeId: book.activeId === id ? neighbor.id : book.activeId };
}

/** Aplica un cambio a las líneas de la orden activa. */
export function updateActiveLines(
  book: OrderBook,
  change: (lines: CartLine[]) => CartLine[],
): OrderBook {
  const active = activeOrder(book);
  return {
    ...book,
    orders: book.orders.map((order) =>
      order.id === active.id ? { ...order, lines: change(order.lines) } : order,
    ),
  };
}
