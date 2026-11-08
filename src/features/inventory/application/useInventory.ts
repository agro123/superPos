import { useMemo, useState } from 'react';
import { useProducts } from '@/features/catalog';
import { useSalesSince } from '@/features/sales';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { reorderSuggestions, unitsSoldByProduct, type ReorderOptions } from '../domain/reorder';
import {
  watchMovements,
  watchMovementsSince,
  watchSuppliers,
} from '../infrastructure/inventoryRepository';

export { recordStockChange, saveSupplier } from '../infrastructure/inventoryRepository';

export const useMovements = (bid: string) =>
  useLiveQuery(['inventoryMovements', bid], watchMovements(bid));
/** Ajustes de inventario de los últimos `days` días. */
export function useAdjustmentsSince(bid: string, days: number) {
  const [now] = useState(() => Date.now());
  const since = useMemo(() => new Date(now - days * 86_400_000), [now, days]);
  const query = useLiveQuery(['movementsSince', bid, days], watchMovementsSince(bid, since));
  const adjustments = useMemo(
    () => (query.data ?? []).filter((m) => m.type === 'adjustment'),
    [query.data],
  );
  return { adjustments, loading: query.isPending, error: query.error };
}

export const useSuppliers = (bid: string) => useLiveQuery(['suppliers', bid], watchSuppliers(bid));

/** Qué reabastecer según el stock y el ritmo de ventas del periodo. */
export function useReorder(bid: string, options: ReorderOptions) {
  const products = useProducts(bid);
  const { query, sales, voided } = useSalesSince(bid, options.periodDays);
  const rows = useMemo(() => {
    const tracked = (products.data ?? []).filter((p) => p.trackStock && p.active);
    const sold = unitsSoldByProduct(sales.filter((s) => !voided.has(s.id)));
    return reorderSuggestions(tracked, sold, options);
  }, [products.data, sales, voided, options]);
  return {
    rows,
    loading: products.isPending || query.isPending,
    error: products.error ?? query.error,
  };
}
