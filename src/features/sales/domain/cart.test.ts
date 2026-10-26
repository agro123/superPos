import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { addToCart, remainingStock, removeFromCart, setLineQuantity, toTotalsLines } from './cart';

const coffee = { id: 'p1', name: 'Café', priceMinor: money(350000), taxRateBps: 0 };
const cake = { id: 'p2', name: 'Torta', priceMinor: money(600000), taxRateBps: 1900 };

describe('carrito', () => {
  it('agrega productos y acumula cantidades', () => {
    const lines = addToCart(addToCart(addToCart([], coffee), cake), coffee);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ productId: 'p1', quantity: 2, unitPrice: 350000 });
  });

  it('cambia cantidades y quita con 0', () => {
    const lines = addToCart([], coffee);
    expect(setLineQuantity(lines, 'p1', 4)[0]?.quantity).toBe(4);
    expect(setLineQuantity(lines, 'p1', 0)).toEqual([]);
    expect(removeFromCart(addToCart(lines, cake), 'p1').map((l) => l.productId)).toEqual(['p2']);
  });

  it('convierte a líneas de totales sin descuentos', () => {
    expect(toTotalsLines(addToCart([], cake))).toEqual([
      { unitPrice: 600000, quantity: 1, taxRateBps: 1900, discount: 0, voided: false },
    ]);
  });
});

describe('carrito con stock', () => {
  const tea = { ...coffee, id: 'p3', stock: 2 };

  it('no agrega productos agotados', () => {
    expect(addToCart([], { ...tea, stock: 0 })).toEqual([]);
  });

  it('no supera el stock disponible', () => {
    const lines = addToCart(addToCart(addToCart([], tea), tea), tea);
    expect(lines[0]?.quantity).toBe(2);
    expect(setLineQuantity(lines, 'p3', 9)[0]?.quantity).toBe(2);
    expect(remainingStock(lines, tea)).toBe(0);
    expect(remainingStock(lines, coffee)).toBe(Infinity);
  });
});
