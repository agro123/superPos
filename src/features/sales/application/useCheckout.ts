import { ok, type Result } from '@/shared/domain/result';
import type { Tender } from '@/shared/domain/payment';
import type { CartLine } from '../domain/cart';
import { buildCheckout } from '../domain/checkout';
import type { NewSale } from '../domain/ports';
import { formatSaleNumber } from '../domain/saleNumber';
import type { Totals } from '../domain/totals';
import { saleWriter } from '../infrastructure/saleWriter';
import { useSaleSequenceStore } from './saleSequence';

export interface CheckoutContext {
  businessId: string;
  deviceCode: string;
  cashShiftId: string;
  terminalId: string | null;
  uid: string;
  tracksStock: (productId: string) => boolean;
}

/** Registra la venta sin esperar a la red (offline-first, `trackWrite`). */
export function useCheckout(context: CheckoutContext) {
  const nextSequence = useSaleSequenceStore((state) => state.next);
  return (
    lines: readonly CartLine[],
    totals: Totals,
    tenders: readonly Tender[],
    customerId: string | null,
  ): Result<NewSale> => {
    const draft = {
      id: saleWriter.newId(context.businessId),
      deviceCode: context.deviceCode,
      cashShiftId: context.cashShiftId,
      terminalId: context.terminalId,
      customerId,
      lines,
      totals,
      tenders,
      occurredAt: new Date(),
      tracksStock: context.tracksStock,
    };
    // El número se asigna después de validar: un cobro rechazado no consume secuencia.
    const result = buildCheckout(draft);
    if (!result.ok) return result;
    const sale: NewSale = {
      ...result.value.sale,
      number: formatSaleNumber(context.deviceCode, nextSequence(context.deviceCode)),
    };
    saleWriter.record(context.businessId, sale, result.value.stock, context.uid);
    return ok(sale);
  };
}
