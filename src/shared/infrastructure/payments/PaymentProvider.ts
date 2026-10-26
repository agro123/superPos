import type { CurrencyCode, Money } from '@/shared/domain/money';
import type { PaymentMethod, PaymentStatus } from '@/shared/domain/payment';
import type { Result } from '@/shared/domain/result';

export interface PaymentIntentRequest {
  /** Misma clave + misma solicitud = mismo resultado (reintentos seguros). */
  idempotencyKey: string;
  amount: Money;
  currency: CurrencyCode;
  method: PaymentMethod;
  /** Referencia del negocio (p. ej. id de la venta). */
  reference: string;
}

export interface PaymentIntent {
  id: string;
  idempotencyKey: string;
  method: PaymentMethod;
  amount: Money;
  currency: CurrencyCode;
  status: PaymentStatus;
  /** Referencia del proveedor externo (autorización, transacción). */
  providerReference: string | null;
  failureReason: string | null;
}

/**
 * Puerto de pagos (docs/architecture/payments.md, ADR 0007).
 * Los pagos electrónicos reales requieren servidor (Cloud Functions + webhooks):
 * el cliente nunca guarda claves secretas del proveedor.
 */
export interface PaymentProvider {
  readonly id: string;
  readonly methods: readonly PaymentMethod[];
  /** `false` si funciona sin conexión (efectivo). */
  readonly requiresNetwork: boolean;
  createPaymentIntent(request: PaymentIntentRequest): Promise<Result<PaymentIntent>>;
  confirm(intentId: string, idempotencyKey: string): Promise<Result<PaymentIntent>>;
  refund(intentId: string, idempotencyKey: string): Promise<Result<PaymentIntent>>;
  getStatus(intentId: string): Promise<Result<PaymentIntent>>;
}
