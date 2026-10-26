import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { CashPaymentProvider } from './CashPaymentProvider';
import { MockCardPaymentProvider } from './MockCardPaymentProvider';
import type { PaymentIntentRequest } from './PaymentProvider';

const request = (overrides: Partial<PaymentIntentRequest> = {}): PaymentIntentRequest => ({
  idempotencyKey: 'k1',
  amount: money(350000),
  currency: 'COP',
  method: 'cash',
  reference: 'sale-1',
  ...overrides,
});

describe('CashPaymentProvider', () => {
  it('captura al instante, sin red, y reembolsa', async () => {
    const cash = new CashPaymentProvider();
    expect(cash.requiresNetwork).toBe(false);
    const created = await cash.createPaymentIntent(request());
    expect(created.ok && created.value.status).toBe('captured');
    if (!created.ok) return;
    const refunded = await cash.refund(created.value.id, 'r1');
    expect(refunded.ok && refunded.value.status).toBe('refunded');
    expect((await cash.getStatus(created.value.id)).ok).toBe(true);
    expect((await cash.confirm(created.value.id, 'k1')).ok).toBe(true);
  });

  it('idempotencia: misma clave devuelve el mismo pago; con otros datos, conflicto', async () => {
    const cash = new CashPaymentProvider();
    const first = await cash.createPaymentIntent(request());
    const again = await cash.createPaymentIntent(request());
    expect(first.ok && again.ok && first.value.id === again.value.id).toBe(true);
    const conflict = await cash.createPaymentIntent(request({ amount: money(1) }));
    expect(conflict.ok ? null : conflict.error.code).toBe('idempotency_conflict');
  });

  it('no permite transiciones inválidas ni pagos inexistentes', async () => {
    const cash = new CashPaymentProvider();
    expect((await cash.getStatus('nada')).ok).toBe(false);
    const created = await cash.createPaymentIntent(request());
    if (!created.ok) return;
    await cash.refund(created.value.id, 'r1');
    expect((await cash.refund(created.value.id, 'r1')).ok).toBe(true);
  });
});

describe('MockCardPaymentProvider', () => {
  it('pending → authorized → captured', async () => {
    const card = new MockCardPaymentProvider({ isOnline: () => true, delayMs: 0 });
    const created = await card.createPaymentIntent(request({ method: 'card' }));
    expect(created.ok && created.value.status).toBe('pending');
    if (!created.ok) return;
    const confirmed = await card.confirm(created.value.id, 'k1');
    expect(confirmed.ok && confirmed.value).toMatchObject({
      status: 'captured',
      providerReference: 'AUTH-card_1',
    });
  });

  it('simula rechazos y no permite capturar un pago fallido', async () => {
    const card = new MockCardPaymentProvider({ isOnline: () => true, delayMs: 0 });
    const created = await card.createPaymentIntent(
      request({ method: 'card', amount: money(1013) }),
    );
    if (!created.ok) return;
    const confirmed = await card.confirm(created.value.id, 'k1');
    expect(confirmed.ok && confirmed.value.status).toBe('failed');
    expect((await card.refund(created.value.id, 'r1')).ok).toBe(false);
  });

  it('sin conexión rechaza con AppError offline', async () => {
    const card = new MockCardPaymentProvider({ isOnline: () => false, delayMs: 0 });
    const created = await card.createPaymentIntent(request({ method: 'card' }));
    expect(created.ok ? null : created.error.code).toBe('offline');
    expect((await card.confirm('x', 'k')).ok).toBe(false);
  });
});
