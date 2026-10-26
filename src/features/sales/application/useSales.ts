import { useMemo } from 'react';
import { voidedSaleIds } from '../domain/sale';
import { saleReader } from '../infrastructure/saleRepository';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { getPlatform, type ReceiptDocument } from '@/shared/infrastructure/platform';

/** Inicio del periodo: medianoche UTC de hace `days` días (estable entre renders). */
function sinceDays(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
}

/** Ventas de los últimos `days` días, en tiempo real, con las anuladas identificadas. */
export function useSalesSince(businessId: string, days: number) {
  const since = sinceDays(days);
  const query = useLiveQuery(
    ['sales', businessId, since.toISOString()],
    saleReader.watchSince(businessId, since),
  );
  const voided = useMemo(() => voidedSaleIds(query.data ?? []), [query.data]);
  const sales = useMemo(
    () => (query.data ?? []).filter((sale) => sale.type === 'sale'),
    [query.data],
  );
  return { query, sales, voided };
}

/** Imprime un ticket a través del adaptador de plataforma (web hoy, Tauri mañana). */
export function printReceipt(receipt: ReceiptDocument) {
  return getPlatform().printReceipt(receipt);
}
