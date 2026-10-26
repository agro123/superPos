import { describe, expect, it } from 'vitest';
import { money } from './money';
import { paymentStatusMachine, summarizeTenders, worksOffline } from './payment';

describe('summarizeTenders', () => {
  const total = money(10000);

  it('calcula vuelto cuando el efectivo excede el total', () => {
    const result = summarizeTenders(total, [{ method: 'cash', amount: money(20000) }]);
    expect(result).toEqual({
      ok: true,
      value: { paid: money(20000), remaining: money(0), change: money(10000) },
    });
  });

  it('soporta pago mixto con saldo pendiente', () => {
    const result = summarizeTenders(total, [
      { method: 'card', amount: money(4000) },
      { method: 'cash', amount: money(3000) },
    ]);
    expect(result.ok && result.value).toEqual({
      paid: money(7000),
      remaining: money(3000),
      change: money(0),
    });
  });

  it('rechaza pagos electrónicos mayores al total y montos no positivos', () => {
    expect(summarizeTenders(total, [{ method: 'card', amount: money(12000) }]).ok).toBe(false);
    expect(summarizeTenders(total, [{ method: 'cash', amount: money(0) }]).ok).toBe(false);
  });
});

describe('paymentStatusMachine', () => {
  it('sigue el ciclo pending → authorized → captured → refunded', () => {
    expect(paymentStatusMachine.canTransition('pending', 'authorized')).toBe(true);
    expect(paymentStatusMachine.canTransition('authorized', 'captured')).toBe(true);
    expect(paymentStatusMachine.canTransition('captured', 'refunded')).toBe(true);
    expect(paymentStatusMachine.canTransition('failed', 'captured')).toBe(false);
    expect(paymentStatusMachine.canTransition('refunded', 'captured')).toBe(false);
  });

  it('solo efectivo y "otro" funcionan sin conexión', () => {
    expect(worksOffline('cash')).toBe(true);
    expect(worksOffline('card')).toBe(false);
  });
});
