import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { addMoney, subtractMoney, ZERO_MONEY, type Money } from '@/shared/domain/money';
import { PAYMENT_METHODS } from '@/shared/domain/payment';
import { moneySchema } from '@/shared/domain/schemas';

/**
 * Proyección de `sales/{id}` con fiado (`creditMinor > 0`). Va aquí y no se importa de `sales`
 * porque `sales` depende de `customers` (selector de cliente y aviso de saldo).
 */
export const creditSaleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['sale', 'void']),
  number: z.string().min(1),
  voidedSaleId: z.string().nullable(),
  customerId: z.string().nullable(),
  creditMinor: moneySchema,
  occurredAt: z.date(),
});
export type CreditSale = z.infer<typeof creditSaleSchema>;

/** `businesses/{bid}/creditPayments/{id}`: abono a la cuenta fiada de un cliente (inmutable). */
export const creditPaymentSchema = z
  .object({
    id: z.string().min(1),
    customerId: z.string().min(1),
    amountMinor: moneySchema,
    method: z.enum(PAYMENT_METHODS),
    cashShiftId: z.string().min(1),
    occurredAt: z.date(),
  })
  .extend(auditFieldsSchema.shape);
export type CreditPayment = z.infer<typeof creditPaymentSchema>;

export const creditPaymentInputSchema = z.object({
  amountMinor: moneySchema.refine((value) => value > 0),
  method: z.enum(PAYMENT_METHODS),
});

export interface CustomerBalance {
  /** Total fiado en ventas vigentes (sin anuladas). */
  owed: Money;
  paid: Money;
  /** Saldo pendiente; nunca negativo (un abono mayor no genera saldo a favor). */
  balance: Money;
  /** Venta fiada más reciente, para mostrar desde cuándo debe. */
  lastCreditAt: Date | null;
}

/**
 * Saldo por cliente a partir de documentos inmutables (ventas fiadas − anulaciones − abonos):
 * no hay un contador editable que un cliente modificado pudiera alterar.
 */
export function customerBalances(
  sales: readonly CreditSale[],
  payments: readonly Pick<CreditPayment, 'customerId' | 'amountMinor'>[],
): Map<string, CustomerBalance> {
  const voided = new Set(
    sales.flatMap((s) => (s.type === 'void' && s.voidedSaleId ? [s.voidedSaleId] : [])),
  );
  const result = new Map<string, CustomerBalance>();
  const entry = (customerId: string) => {
    const current = result.get(customerId) ?? {
      owed: ZERO_MONEY,
      paid: ZERO_MONEY,
      balance: ZERO_MONEY,
      lastCreditAt: null,
    };
    result.set(customerId, current);
    return current;
  };
  for (const sale of sales) {
    if (sale.type !== 'sale' || !sale.customerId || voided.has(sale.id)) continue;
    const current = entry(sale.customerId);
    current.owed = addMoney(current.owed, sale.creditMinor);
    if (!current.lastCreditAt || sale.occurredAt > current.lastCreditAt) {
      current.lastCreditAt = sale.occurredAt;
    }
  }
  for (const payment of payments) {
    const current = entry(payment.customerId);
    current.paid = addMoney(current.paid, payment.amountMinor);
  }
  for (const current of result.values()) {
    current.balance =
      current.paid >= current.owed ? ZERO_MONEY : subtractMoney(current.owed, current.paid);
  }
  return result;
}

export const balanceOf = (
  balances: ReadonlyMap<string, CustomerBalance>,
  customerId: string | null,
) => (customerId ? (balances.get(customerId)?.balance ?? ZERO_MONEY) : ZERO_MONEY);
