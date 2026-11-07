import { AppError } from './errors';
import { addMoney, money, subtractMoney, ZERO_MONEY, type Money } from './money';
import { err, ok, type Result } from './result';
import { defineStateMachine } from './stateMachine';

export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'wallet', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Formas de saldar una venta: los medios de pago configurables más `credit` (fiado), que no es
 * un ingreso sino una cuenta por cobrar a un cliente registrado.
 */
export const TENDER_METHODS = [...PAYMENT_METHODS, 'credit'] as const;
export type TenderMethod = (typeof TENDER_METHODS)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Ciclo de vida de un pago (docs/architecture/payments.md). */
export const paymentStatusMachine = defineStateMachine<PaymentStatus>('payment', {
  pending: ['authorized', 'captured', 'failed'],
  authorized: ['captured', 'failed'],
  captured: ['refunded'],
  failed: [],
  refunded: [],
});

/** Métodos que se pueden registrar sin conexión (no requieren un proveedor externo). */
export function worksOffline(method: TenderMethod): boolean {
  return method === 'cash' || method === 'other' || method === 'credit';
}

export interface Tender {
  method: TenderMethod;
  amount: Money;
}

export interface TenderSummary {
  paid: Money;
  remaining: Money;
  change: Money;
}

/**
 * Resume un pago mixto. Solo el efectivo puede exceder el total (genera vuelto);
 * un pago electrónico mayor al saldo es un error.
 */
export function summarizeTenders(total: Money, tenders: readonly Tender[]): Result<TenderSummary> {
  const paid = addMoney(...tenders.map((tender) => tender.amount));
  const cash = addMoney(...tenders.filter((t) => t.method === 'cash').map((t) => t.amount));
  const nonCash = subtractMoney(paid, cash);
  if (tenders.some((tender) => tender.amount <= 0)) {
    return err(new AppError('validation', 'Cada pago debe ser mayor que cero'));
  }
  if (nonCash > total) {
    return err(new AppError('validation', 'Los pagos electrónicos superan el total'));
  }
  const remaining = paid >= total ? ZERO_MONEY : subtractMoney(total, paid);
  const change = paid > total ? money(paid - total) : ZERO_MONEY;
  return ok({ paid, remaining, change });
}
