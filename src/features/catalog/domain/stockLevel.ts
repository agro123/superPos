export type StockLevel = 'untracked' | 'out' | 'low' | 'ok';

interface Stocked {
  trackStock: boolean;
  stock: number;
  lowStockThreshold: number;
}

/** Nivel de stock para alertas. El stock puede ser negativo tras ventas offline (ADR 0003). */
export function stockLevelOf(item: Stocked): StockLevel {
  if (!item.trackStock) return 'untracked';
  if (item.stock <= 0) return 'out';
  if (item.stock <= item.lowStockThreshold) return 'low';
  return 'ok';
}
