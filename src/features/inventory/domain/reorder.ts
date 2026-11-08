/** Producto con stock controlado, tal como lo necesita la sugerencia. */
export interface ReorderProduct {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
}

export interface ReorderRow {
  productId: string;
  name: string;
  stock: number;
  threshold: number;
  /** Unidades vendidas por día en el periodo analizado. */
  dailyRate: number;
  /** Días que alcanza el stock al ritmo actual (`null` si no se vendió). */
  daysLeft: number | null;
  /** Unidades a pedir para cubrir `coverDays` y quedar sobre el umbral. */
  suggested: number;
  urgency: 'out' | 'low' | 'soon';
}

export interface ReorderOptions {
  /** Días de ventas analizados. */
  periodDays: number;
  /** Días que debe durar el pedido. */
  coverDays: number;
  /** Se avisa si el stock dura menos que esto (tiempo de entrega del proveedor). */
  leadDays: number;
}

/**
 * Qué reabastecer y cuánto: productos agotados, bajo el umbral o que no alcanzan el tiempo de
 * entrega al ritmo de venta del periodo. Ordenados por urgencia y días restantes.
 */
export function reorderSuggestions(
  products: readonly ReorderProduct[],
  unitsSold: ReadonlyMap<string, number>,
  { periodDays, coverDays, leadDays }: ReorderOptions,
): ReorderRow[] {
  const rows: ReorderRow[] = [];
  for (const product of products) {
    const dailyRate = (unitsSold.get(product.id) ?? 0) / Math.max(1, periodDays);
    const daysLeft = dailyRate > 0 ? Math.max(0, product.stock) / dailyRate : null;
    const urgency =
      product.stock <= 0
        ? 'out'
        : product.stock <= product.lowStockThreshold
          ? 'low'
          : daysLeft !== null && daysLeft < leadDays
            ? 'soon'
            : null;
    if (!urgency) continue;
    const target = Math.ceil(dailyRate * coverDays) + product.lowStockThreshold;
    rows.push({
      productId: product.id,
      name: product.name,
      stock: product.stock,
      threshold: product.lowStockThreshold,
      dailyRate,
      daysLeft,
      suggested: Math.max(1, target - Math.max(0, product.stock)),
      urgency,
    });
  }
  const rank = { out: 0, low: 1, soon: 2 } as const;
  return rows.sort(
    (a, b) =>
      rank[a.urgency] - rank[b.urgency] || (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity),
  );
}

/** Unidades vendidas por producto (líneas no anuladas de ventas vigentes). */
export function unitsSoldByProduct(
  sales: readonly { lines: readonly { productId: string; quantity: number; voided: boolean }[] }[],
): Map<string, number> {
  const result = new Map<string, number>();
  for (const sale of sales) {
    for (const line of sale.lines) {
      if (!line.voided)
        result.set(line.productId, (result.get(line.productId) ?? 0) + line.quantity);
    }
  }
  return result;
}

/** Texto del pedido para enviar al proveedor (WhatsApp o correo). */
export function purchaseOrderText(
  businessName: string,
  supplierName: string | null,
  rows: readonly { name: string; quantity: number }[],
): string {
  const greeting = supplierName ? `Hola ${supplierName},` : 'Hola,';
  const lines = rows.map((row) => `• ${row.name}: ${String(row.quantity)}`);
  return [greeting, `${businessName} quiere hacer este pedido:`, '', ...lines, '', 'Gracias.'].join(
    '\n',
  );
}
