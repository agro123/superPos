import { money, type Money } from '@/shared/domain/money';
import type { TotalsLine } from './totals';

/** Línea del carrito en curso (borrador local, persistido en IndexedDB). */
export interface CartLine {
  productId: string;
  name: string;
  unitPrice: Money;
  taxRateBps: number;
  quantity: number;
  /** Costo unitario del catálogo al agregar (para el margen). */
  unitCost?: Money | null;
  /** Tope por stock disponible; ausente si el producto no controla stock. */
  maxQuantity?: number;
}

/** Datos del producto que necesita el carrito. El precio viene siempre del catálogo (L6). */
export interface CartProduct {
  id: string;
  name: string;
  priceMinor: Money;
  taxRateBps: number;
  /** Stock disponible si el producto lo controla. */
  stock?: number;
  costMinor?: Money | null;
}

/** Unidades que aún se pueden agregar de un producto (`Infinity` si no controla stock). */
export function remainingStock(lines: readonly CartLine[], product: CartProduct): number {
  if (product.stock === undefined) return Infinity;
  const inCart = lines.find((line) => line.productId === product.id)?.quantity ?? 0;
  return Math.max(0, product.stock - inCart);
}

/** Agrega el producto; no supera el stock disponible ni agrega productos agotados. */
export function addToCart(
  lines: readonly CartLine[],
  product: CartProduct,
  quantity = 1,
): CartLine[] {
  const existing = lines.find((line) => line.productId === product.id);
  if (existing) {
    const withMax = lines.map((line) =>
      line.productId === product.id ? { ...line, maxQuantity: product.stock } : line,
    );
    return setLineQuantity(withMax, product.id, existing.quantity + quantity);
  }
  if (remainingStock(lines, product) <= 0) return [...lines];
  return [
    ...lines,
    {
      productId: product.id,
      name: product.name,
      unitPrice: product.priceMinor,
      taxRateBps: product.taxRateBps,
      unitCost: product.costMinor ?? null,
      quantity: Math.min(quantity, product.stock ?? Infinity),
      ...(product.stock === undefined ? {} : { maxQuantity: product.stock }),
    },
  ];
}

/** Cambia la cantidad (limitada por `maxQuantity`); 0 o menos quita la línea. */
export function setLineQuantity(
  lines: readonly CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) return removeFromCart(lines, productId);
  return lines.map((line) =>
    line.productId === productId
      ? { ...line, quantity: Math.min(quantity, line.maxQuantity ?? Infinity) }
      : line,
  );
}

export function removeFromCart(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}

export function toTotalsLines(lines: readonly CartLine[]): TotalsLine[] {
  return lines.map((line) => ({
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    taxRateBps: line.taxRateBps,
    discount: money(0),
    voided: false,
  }));
}
