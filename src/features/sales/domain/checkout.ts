import { addMoney, ZERO_MONEY } from '@/shared/domain/money';
import { summarizeTenders, type Tender } from '@/shared/domain/payment';
import type { Result } from '@/shared/domain/result';
import { err, ok } from '@/shared/domain/result';
import { AppError } from '@/shared/domain/errors';
import type { CartLine } from './cart';
import type { NewSale } from './ports';
import type { SaleLine } from './sale';
import { stockDecrementsFor, type StockDecrement } from './stock';
import type { Totals } from './totals';

export interface CheckoutInput {
  id: string;
  deviceCode: string;
  cashShiftId: string;
  terminalId: string | null;
  /** Cliente registrado (opcional; obligatorio si hay fiado). */
  customerId: string | null;
  lines: readonly CartLine[];
  totals: Totals;
  /** Pagos tal como los entregó el cliente; el efectivo puede exceder el total (vuelto). */
  tenders: readonly Tender[];
  occurredAt: Date;
  /** `true` si el producto controla stock (se descuenta con `increment`). */
  tracksStock: (productId: string) => boolean;
}

export interface Checkout {
  sale: NewSale;
  stock: StockDecrement[];
}

/**
 * Arma la venta inmutable a partir del carrito (precios del catálogo, L6) y los descuentos de stock
 * de los productos que lo controlan. Falla si los pagos no cubren el total.
 */
export function buildCheckout(input: CheckoutInput): Result<Checkout> {
  if (input.lines.length === 0) return err(new AppError('validation', 'Carrito vacío'));
  const summary = summarizeTenders(input.totals.total, input.tenders);
  if (!summary.ok) return summary;
  if (summary.value.remaining > 0) {
    return err(new AppError('validation', 'Los pagos no cubren el total'));
  }
  const credit = addMoney(
    ...input.tenders.filter((t) => t.method === 'credit').map((t) => t.amount),
  );
  if (credit > 0 && !input.customerId) {
    return err(new AppError('validation', 'El fiado exige un cliente registrado'));
  }
  const lines: SaleLine[] = input.lines.map((line) => ({
    productId: line.productId,
    name: line.name,
    unitPriceMinor: line.unitPrice,
    quantity: line.quantity,
    taxRateBps: line.taxRateBps,
    discountMinor: ZERO_MONEY,
    voided: false,
  }));
  return ok({
    sale: {
      id: input.id,
      type: 'sale',
      // Lo asigna la aplicación tras validar (secuencia local, ADR 0006).
      number: '',
      deviceCode: input.deviceCode,
      lines,
      subtotalMinor: input.totals.subtotal,
      discountMinor: input.totals.discountTotal,
      taxMinor: input.totals.taxTotal,
      totalMinor: input.totals.total,
      payments: input.tenders.map((tender) => ({
        method: tender.method,
        amountMinor: tender.amount,
        status: 'captured',
        reference: null,
      })),
      changeMinor: summary.value.change,
      creditMinor: credit,
      customerId: input.customerId,
      cashShiftId: input.cashShiftId,
      terminalId: input.terminalId,
      voidedSaleId: null,
      voidReason: null,
      occurredAt: input.occurredAt,
    },
    stock: stockDecrementsFor(lines, input.tracksStock),
  });
}
