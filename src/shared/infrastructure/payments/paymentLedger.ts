import { AppError } from '@/shared/domain/errors';
import { paymentStatusMachine, type PaymentStatus } from '@/shared/domain/payment';
import { err, ok, type Result } from '@/shared/domain/result';
import type { PaymentIntent, PaymentIntentRequest } from './PaymentProvider';

/**
 * Registro en memoria de intents con idempotencia y transiciones validadas.
 * Base común de los proveedores locales/simulados.
 */
export class PaymentLedger {
  private readonly intents = new Map<string, PaymentIntent>();
  private readonly byKey = new Map<string, { intentId: string; fingerprint: string }>();
  private sequence = 0;

  constructor(private readonly prefix: string) {}

  /** Devuelve el intent existente para la clave, o crea uno nuevo con `initial`. */
  create(request: PaymentIntentRequest, initial: PaymentStatus): Result<PaymentIntent> {
    const fingerprint = `${request.amount}|${request.currency}|${request.method}|${request.reference}`;
    const previous = this.byKey.get(request.idempotencyKey);
    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        return err(
          new AppError(
            'idempotency_conflict',
            'La clave de idempotencia ya se usó con otros datos',
          ),
        );
      }
      return this.get(previous.intentId);
    }
    this.sequence += 1;
    const intent: PaymentIntent = {
      id: `${this.prefix}_${this.sequence}`,
      idempotencyKey: request.idempotencyKey,
      method: request.method,
      amount: request.amount,
      currency: request.currency,
      status: initial,
      providerReference: null,
      failureReason: null,
    };
    this.intents.set(intent.id, intent);
    this.byKey.set(request.idempotencyKey, { intentId: intent.id, fingerprint });
    return ok(intent);
  }

  get(intentId: string): Result<PaymentIntent> {
    const intent = this.intents.get(intentId);
    return intent ? ok(intent) : err(new AppError('not_found', `Pago ${intentId} no existe`));
  }

  /** Aplica una transición validada por `paymentStatusMachine`; repetirla es un no-op (idempotente). */
  transition(
    intentId: string,
    to: PaymentStatus,
    patch: Partial<PaymentIntent> = {},
  ): Result<PaymentIntent> {
    const current = this.get(intentId);
    if (!current.ok) return current;
    if (current.value.status === to) return current;
    if (!paymentStatusMachine.canTransition(current.value.status, to)) {
      return err(new AppError('invalid_transition', `Pago: ${current.value.status} → ${to}`));
    }
    const next = { ...current.value, ...patch, status: to };
    this.intents.set(intentId, next);
    return ok(next);
  }
}
