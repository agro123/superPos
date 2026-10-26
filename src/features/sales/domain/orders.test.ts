import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { addToCart } from './cart';
import {
  activeOrder,
  closeOrder,
  createOrderBook,
  MAX_OPEN_ORDERS,
  openOrder,
  selectOrder,
  updateActiveLines,
} from './orders';

const coffee = { id: 'p1', name: 'Café', priceMinor: money(350000), taxRateBps: 0 };

describe('órdenes del carrito', () => {
  it('abre órdenes independientes y cambia entre ellas', () => {
    let book = updateActiveLines(createOrderBook('a'), (lines) => addToCart(lines, coffee));
    book = openOrder(book, 'b');
    expect(activeOrder(book)).toMatchObject({ id: 'b', number: 2, lines: [] });
    book = selectOrder(book, 'a');
    expect(activeOrder(book).lines).toHaveLength(1);
  });

  it('reutiliza el menor número libre y respeta el máximo', () => {
    let book = openOrder(openOrder(createOrderBook('a'), 'b'), 'c');
    book = openOrder(closeOrder(book, 'b', 'x'), 'd');
    expect(book.orders.map((o) => o.number)).toEqual([1, 3, 2]);
    for (let i = 0; i < MAX_OPEN_ORDERS + 2; i += 1) book = openOrder(book, `n${String(i)}`);
    expect(book.orders).toHaveLength(MAX_OPEN_ORDERS);
  });

  it('al cerrar activa la vecina o deja una orden vacía', () => {
    const book = openOrder(createOrderBook('a'), 'b');
    expect(closeOrder(book, 'b', 'x').activeId).toBe('a');
    expect(closeOrder(closeOrder(book, 'b', 'x'), 'a', 'x')).toEqual(createOrderBook('x'));
  });
});
