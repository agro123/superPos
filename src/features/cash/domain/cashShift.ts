import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { addMoney, subtractMoney, type Money } from '@/shared/domain/money';
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

export const openShiftInputSchema = z.object({ openingFloatMinor: moneySchema });
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
