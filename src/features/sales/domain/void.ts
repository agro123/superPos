import { AppError } from '@/shared/domain/errors';
import { err, ok, type Result } from '@/shared/domain/result';
import type { NewSale } from './ports';
import type { Sale } from './sale';
import { stockDecrementsFor, type StockDecrement } from './stock';

/** Id determinista de la anulación: una venta solo se puede anular una vez (lo exigen las reglas). */
export const voidIdFor = (saleId: string) => `void-${saleId}`;

export interface VoidInput {
  sale: Sale;
  reason: string;
  deviceCode: string;
  /** Terminal de quien anula (no el de la venta: ese pudo ser revocado). */
  terminalId: string | null;
  occurredAt: Date;
  tracksStock: (productId: string) => boolean;
}

export interface VoidResult {
  voidSale: NewSale;
  /** Unidades a devolver al stock (`increment(+quantity)`). */
  restock: StockDecrement[];
}

/**
 * Anulación = documento nuevo `void` (la venta original es inmutable, L6). Copia líneas, pagos y
 * fiado para que reportes, caja y saldos de clientes resten la venta; conserva el turno original.
 */
export function buildVoid(input: VoidInput): Result<VoidResult> {
  const reason = input.reason.trim();
  if (input.sale.type !== 'sale') return err(new AppError('validation', 'Solo se anulan ventas'));
  if (reason.length < 3 || reason.length > 200) {
    return err(new AppError('validation', 'Escribe el motivo de la anulación'));
  }
  // Campos explícitos: la venta leída puede traer extras del cliente (p. ej. `pendingSync`).
  const sale = input.sale;
  return ok({
    voidSale: {
      lines: sale.lines,
      subtotalMinor: sale.subtotalMinor,
      discountMinor: sale.discountMinor,
      taxMinor: sale.taxMinor,
      totalMinor: sale.totalMinor,
      payments: sale.payments,
      changeMinor: sale.changeMinor,
      creditMinor: sale.creditMinor,
      customerId: sale.customerId,
      cashShiftId: sale.cashShiftId,
      terminalId: input.terminalId,
      id: voidIdFor(input.sale.id),
      type: 'void',
      number: `${input.sale.number}-A`,
      deviceCode: input.deviceCode,
      voidedSaleId: input.sale.id,
      voidReason: reason,
      occurredAt: input.occurredAt,
    },
    restock: stockDecrementsFor(input.sale.lines, input.tracksStock),
  });
}
