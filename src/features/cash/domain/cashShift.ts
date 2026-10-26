import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { addMoney, subtractMoney, ZERO_MONEY, type Money } from '@/shared/domain/money';
import { PAYMENT_METHODS, type PaymentMethod } from '@/shared/domain/payment';
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

/** Pago de una venta tal como lo necesita el arqueo. */
export const shiftSalePaymentSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amountMinor: moneySchema,
});

/**
 * Proyección de `sales/{id}` que lee la caja: solo pagos y vuelto. Se mantiene aquí (y no se
 * importa de `sales`) porque `sales` ya depende de `cash` para exigir un turno abierto.
 */
export const shiftSaleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['sale', 'void']),
  voidedSaleId: z.string().nullable(),
  payments: z.array(shiftSalePaymentSchema),
  changeMinor: moneySchema,
});
export type ShiftSale = z.infer<typeof shiftSaleSchema>;

/** Resumen del turno para el cierre. */
export interface ShiftSummary {
  salesCount: number;
  /** Efectivo recibido de los clientes (antes de dar vuelto). */
  cashReceived: Money;
  changeGiven: Money;
  expensesTotal: Money;
  /** Salidas de efectivo: vueltos + gastos. */
  cashOut: Money;
  /** Ingreso neto por método (efectivo ya neto de vuelto). */
  byMethod: Readonly<Record<PaymentMethod, Money>>;
  expectedCash: Money;
}

/** Resume las ventas del turno (sin las anuladas) y sus gastos. */
export function summarizeShift(
  openingFloat: Money,
  sales: readonly ShiftSale[],
  expenses: readonly Money[],
): ShiftSummary {
  const voided = new Set(
    sales.flatMap((s) => (s.type === 'void' && s.voidedSaleId ? [s.voidedSaleId] : [])),
  );
  const valid = sales.filter((sale) => sale.type === 'sale' && !voided.has(sale.id));
  const byMethod: Record<PaymentMethod, Money> = {
    cash: ZERO_MONEY,
    card: ZERO_MONEY,
    transfer: ZERO_MONEY,
    wallet: ZERO_MONEY,
    other: ZERO_MONEY,
  };
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
  return {
    salesCount: valid.length,
    cashReceived,
    changeGiven,
    expensesTotal,
    cashOut: addMoney(changeGiven, expensesTotal),
    byMethod,
    expectedCash: expectedCash(openingFloat, [byMethod.cash], expenses),
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
