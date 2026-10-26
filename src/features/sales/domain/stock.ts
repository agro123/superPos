import type { SaleLine } from './sale';

/** Descuento de stock de una venta. Se aplica con `increment(-quantity)` en la misma escritura (L1). */
export interface StockDecrement {
  productId: string;
  quantity: number;
}

/**
 * Agrupa por producto las cantidades a descontar, sin líneas anuladas
 * y solo para productos que controlan stock.
 */
export function stockDecrementsFor(
  lines: readonly SaleLine[],
  tracksStock: (productId: string) => boolean,
): StockDecrement[] {
  const totals = new Map<string, number>();
  for (const line of lines) {
    if (line.voided || !tracksStock(line.productId)) continue;
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  }
  return [...totals].map(([productId, quantity]) => ({ productId, quantity }));
}
