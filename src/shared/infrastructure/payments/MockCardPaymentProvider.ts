import { AppError } from '@/shared/domain/errors';
import { err } from '@/shared/domain/result';
import type { PaymentProvider } from './PaymentProvider';
import { PaymentLedger } from './paymentLedger';

export interface MockCardOptions {
  isOnline?: () => boolean;
  /** Latencia simulada del datáfono. */
  delayMs?: number;
}

/**
 * Datáfono simulado para desarrollo y pruebas. Requiere conexión.
 * Los montos terminados en 13 (unidad mínima) se rechazan, para probar el flujo de error.
 */
export class MockCardPaymentProvider implements PaymentProvider {
  readonly id = 'mock-card';
  readonly methods = ['card', 'wallet'] as const;
  readonly requiresNetwork = true;
  private readonly ledger = new PaymentLedger('card');
  private readonly isOnline: () => boolean;
  private readonly delayMs: number;

  constructor(options: MockCardOptions = {}) {
    this.isOnline = options.isOnline ?? (() => navigator.onLine);
    this.delayMs = options.delayMs ?? 800;
  }

  createPaymentIntent: PaymentProvider['createPaymentIntent'] = (request) => {
    if (!this.isOnline())
      return Promise.resolve(err(new AppError('offline', 'El pago con tarjeta requiere conexión')));
    return Promise.resolve(this.ledger.create(request, 'pending'));
  };

  confirm: PaymentProvider['confirm'] = async (intentId) => {
    if (!this.isOnline())
      return err(new AppError('offline', 'El pago con tarjeta requiere conexión'));
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    const current = this.ledger.get(intentId);
    if (!current.ok) return current;
    if (current.value.amount % 100 === 13) {
      return this.ledger.transition(intentId, 'failed', {
        failureReason: 'Tarjeta rechazada (simulado)',
      });
    }
    const authorized = this.ledger.transition(intentId, 'authorized', {
      providerReference: `AUTH-${intentId}`,
    });
    return authorized.ok ? this.ledger.transition(intentId, 'captured') : authorized;
  };

  refund: PaymentProvider['refund'] = (intentId) =>
    Promise.resolve(this.ledger.transition(intentId, 'refunded'));

  getStatus: PaymentProvider['getStatus'] = (intentId) =>
    Promise.resolve(this.ledger.get(intentId));
}
