import type { PaymentProvider } from './PaymentProvider';
import { PaymentLedger } from './paymentLedger';

/** Efectivo: se captura al instante y funciona sin conexión. */
export class CashPaymentProvider implements PaymentProvider {
  readonly id = 'cash';
  readonly methods = ['cash'] as const;
  readonly requiresNetwork = false;
  private readonly ledger = new PaymentLedger('cash');

  createPaymentIntent: PaymentProvider['createPaymentIntent'] = (request) =>
    Promise.resolve(this.ledger.create(request, 'captured'));

  confirm: PaymentProvider['confirm'] = (intentId) => Promise.resolve(this.ledger.get(intentId));

  refund: PaymentProvider['refund'] = (intentId) =>
    Promise.resolve(this.ledger.transition(intentId, 'refunded'));

  getStatus: PaymentProvider['getStatus'] = (intentId) =>
    Promise.resolve(this.ledger.get(intentId));
}
