import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { addMoney, subtractMoney, ZERO_MONEY, type Money } from '@/shared/domain/money';
import { PAYMENT_METHODS, TENDER_METHODS, type TenderMethod } from '@/shared/domain/payment';
import { moneySchema, optionalText } from '@/shared/domain/schemas';
import { defineStateMachine } from '@/shared/domain/stateMachine';

export const CASH_SHIFT_STATUSES = ['open', 'closing', 'closed'] as const;
export type CashShiftStatus = (typeof CASH_SHIFT_STATUSES)[number];

/** Turno de caja: abierto → en cierre (arqueo) → cerrado. El arqueo puede cancelarse. */
export const cashShiftMachine = defineStateMachine<CashShiftStatus>('cashShift', {
  open: ['closing'],
  closing: ['open', 'closed'],
  closed: [],
});

/** `businesses/{bid}/cashShifts/{shiftId}`. Un turno abierto por dispositivo (ADR 0009, propuesto). */
export const cashShiftSchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(CASH_SHIFT_STATUSES),
    deviceCode: z.string().min(1),
    openedBy: z.string().min(1),
    openedAt: z.date(),
    openingFloatMinor: moneySchema,
    closedBy: z.string().nullable(),
    closedAt: z.date().nullable(),
    countedCashMinor: moneySchema.nullable(),
    expectedCashMinor: moneySchema.nullable(),
    notes: optionalText(500),
  })
  .extend(auditFieldsSchema.shape);

export type CashShift = z.infer<typeof cashShiftSchema>;

/** `cashShifts/{shiftId}/expenses/{id}`: salidas de efectivo durante el turno. */
export const expenseSchema = z
  .object({
    id: z.string().min(1),
    amountMinor: moneySchema,
    description: z.string().trim().min(1).max(200),
  })
  .extend(auditFieldsSchema.shape);

export type Expense = z.infer<typeof expenseSchema>;

/** Abrir caja exige una base de efectivo mayor que cero. */
export const openShiftInputSchema = z.object({
  openingFloatMinor: moneySchema.refine((value) => value > 0),
});
export const closeShiftInputSchema = z.object({
  countedCashMinor: moneySchema,
  notes: optionalText(500),
});

/** Efectivo esperado en caja = base + ventas en efectivo (neto de vuelto) − gastos. */
export function expectedCash(
  openingFloat: Money,
  cashSales: readonly Money[],
  expenses: readonly Money[],
): Money {
  return subtractMoney(addMoney(openingFloat, ...cashSales), addMoney(...expenses));
}

/** Diferencia del arqueo: positiva = sobrante, negativa = faltante. */
export function cashDifference(counted: Money, expected: Money): Money {
  return subtractMoney(counted, expected);
}

/** Pago de una venta tal como lo necesita el arqueo (incluye `credit`: fiado). */
export const shiftSalePaymentSchema = z.object({
  method: z.enum(TENDER_METHODS),
  amountMinor: moneySchema,
});

/**
 * Proyección de `sales/{id}` que lee la caja: pagos, vuelto y quién vendió. Se mantiene aquí (y no
 * se importa de `sales`) porque `sales` ya depende de `cash` para exigir un turno abierto.
 */
export const shiftSaleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['sale', 'void']),
  number: z.string().min(1),
  voidedSaleId: z.string().nullable(),
  cashShiftId: z.string().nullable(),
  payments: z.array(shiftSalePaymentSchema),
  changeMinor: moneySchema,
  createdBy: z.string().min(1),
  occurredAt: z.date(),
});
export type ShiftSale = z.infer<typeof shiftSaleSchema>;

/**
 * Proyección de `creditPayments/{id}` (abonos a fiado, feature customers). Proyección propia por
 * la misma razón: `customers` depende de `cash` (el abono exige caja abierta).
 */
export const shiftCreditPaymentSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  amountMinor: moneySchema,
  method: z.enum(PAYMENT_METHODS),
  cashShiftId: z.string().min(1),
  createdBy: z.string().min(1),
  occurredAt: z.date(),
});
export type ShiftCreditPayment = z.infer<typeof shiftCreditPaymentSchema>;

const zeroByMethod = (): Record<TenderMethod, Money> => ({
  cash: ZERO_MONEY,
  card: ZERO_MONEY,
  transfer: ZERO_MONEY,
  wallet: ZERO_MONEY,
  other: ZERO_MONEY,
  credit: ZERO_MONEY,
});

/** Resumen del turno para el cierre. */
export interface ShiftSummary {
  salesCount: number;
  /** Efectivo recibido de los clientes en ventas (antes de dar vuelto). */
  cashReceived: Money;
  changeGiven: Money;
  expensesTotal: Money;
  /** Abonos a fiado recibidos en efectivo (entran al cajón). */
  creditCollectedCash: Money;
  /** Abonos a fiado por cualquier medio. */
  creditCollected: Money;
  /** Salidas de efectivo: vueltos + gastos. */
  cashOut: Money;
  /** Vendido por método (efectivo ya neto de vuelto; `credit` = fiado por cobrar). */
  byMethod: Readonly<Record<TenderMethod, Money>>;
  expectedCash: Money;
}

/** Ventas vigentes: sin anulaciones ni ventas anuladas. */
export function validSales<T extends Pick<ShiftSale, 'id' | 'type' | 'voidedSaleId'>>(
  sales: readonly T[],
): T[] {
  const voided = new Set(
    sales.flatMap((s) => (s.type === 'void' && s.voidedSaleId ? [s.voidedSaleId] : [])),
  );
  return sales.filter((sale) => sale.type === 'sale' && !voided.has(sale.id));
}

/** Resume las ventas del turno (sin las anuladas), sus gastos y los abonos a fiado. */
export function summarizeShift(
  openingFloat: Money,
  sales: readonly Pick<ShiftSale, 'id' | 'type' | 'voidedSaleId' | 'payments' | 'changeMinor'>[],
  expenses: readonly Money[],
  creditPayments: readonly Pick<ShiftCreditPayment, 'amountMinor' | 'method'>[] = [],
): ShiftSummary {
  const valid = validSales(sales);
  const byMethod = zeroByMethod();
  let cashReceived = ZERO_MONEY;
  let changeGiven = ZERO_MONEY;
  for (const sale of valid) {
    for (const payment of sale.payments) {
      byMethod[payment.method] = addMoney(byMethod[payment.method], payment.amountMinor);
      if (payment.method === 'cash') cashReceived = addMoney(cashReceived, payment.amountMinor);
    }
    changeGiven = addMoney(changeGiven, sale.changeMinor);
  }
  byMethod.cash = subtractMoney(byMethod.cash, changeGiven);
  const expensesTotal = addMoney(...expenses);
  const creditCollected = addMoney(...creditPayments.map((p) => p.amountMinor));
  const creditCollectedCash = addMoney(
    ...creditPayments.filter((p) => p.method === 'cash').map((p) => p.amountMinor),
  );
  return {
    salesCount: valid.length,
    cashReceived,
    changeGiven,
    expensesTotal,
    creditCollectedCash,
    creditCollected,
    cashOut: addMoney(changeGiven, expensesTotal),
    byMethod,
    expectedCash: expectedCash(openingFloat, [byMethod.cash, creditCollectedCash], expenses),
  };
}

/** Turno abierto (o en arqueo) de este dispositivo, si lo hay (ADR 0009). */
export function currentShiftFor<T extends Pick<CashShift, 'status' | 'deviceCode'>>(
  shifts: readonly T[],
  deviceCode: string,
): T | null {
  return shifts.find((s) => s.deviceCode === deviceCode && s.status !== 'closed') ?? null;
}

export const expenseInputSchema = expenseSchema.pick({ amountMinor: true, description: true });
