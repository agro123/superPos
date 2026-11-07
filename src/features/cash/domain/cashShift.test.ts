import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import type { TenderMethod } from '@/shared/domain/payment';
import {
  cashDifference,
  cashShiftMachine,
  currentShiftFor,
  expectedCash,
  summarizeShift,
  type ShiftSale,
} from './cashShift';

describe('cashShiftMachine (L8)', () => {
  it('abre → cierre → cerrado, y el cierre se puede cancelar', () => {
    expect(cashShiftMachine.canTransition('open', 'closing')).toBe(true);
    expect(cashShiftMachine.canTransition('closing', 'open')).toBe(true);
    expect(cashShiftMachine.canTransition('closing', 'closed')).toBe(true);
    expect(cashShiftMachine.canTransition('open', 'closed')).toBe(false);
    expect(cashShiftMachine.isTerminal('closed')).toBe(true);
  });
});

describe('arqueo', () => {
  it('calcula el efectivo esperado y la diferencia', () => {
    const expected = expectedCash(money(50000), [money(12000), money(8000)], [money(5000)]);
    expect(expected).toBe(65000);
    expect(cashDifference(money(64000), expected)).toBe(-1000);
  });
});

describe('summarizeShift', () => {
  const sale = (id: string, payments: [TenderMethod, number][], change = 0): ShiftSale => ({
    id,
    type: 'sale',
    number: id,
    voidedSaleId: null,
    cashShiftId: 'shift1',
    createdBy: 'emp',
    occurredAt: new Date('2026-11-01T10:00:00Z'),
    payments: payments.map(([method, amount]) => ({ method, amountMinor: money(amount) })),
    changeMinor: money(change),
  });

  it('separa ingresos por método y salidas de efectivo, sin ventas anuladas', () => {
    const summary = summarizeShift(
      money(50000),
      [
        sale('s1', [['cash', 20000]], 2000),
        sale('s2', [['card', 15000]]),
        sale('s3', [
          ['transfer', 7000],
          ['cash', 3000],
        ]),
        sale('s4', [['cash', 99999]]),
        { ...sale('v1', []), type: 'void', voidedSaleId: 's4' },
      ],
      [money(4000)],
    );
    expect(summary).toMatchObject({
      salesCount: 3,
      cashReceived: 23000,
      changeGiven: 2000,
      expensesTotal: 4000,
      cashOut: 6000,
      expectedCash: 67000,
    });
    expect(summary.byMethod).toMatchObject({ cash: 21000, card: 15000, transfer: 7000 });
  });
});

describe('summarizeShift con fiado y abonos', () => {
  it('el fiado no entra al cajón; los abonos en efectivo sí', () => {
    const summary = summarizeShift(
      money(10000),
      [
        {
          id: 's1',
          type: 'sale',
          voidedSaleId: null,
          payments: [
            { method: 'cash', amountMinor: money(3000) },
            { method: 'credit', amountMinor: money(7000) },
          ],
          changeMinor: money(0),
        },
      ],
      [],
      [
        { method: 'cash', amountMinor: money(2000) },
        { method: 'transfer', amountMinor: money(500) },
      ],
    );
    expect(summary.byMethod.credit).toBe(7000);
    expect(summary).toMatchObject({ creditCollectedCash: 2000, creditCollected: 2500 });
    expect(summary.expectedCash).toBe(15000);
  });
});

describe('currentShiftFor', () => {
  it('devuelve el turno no cerrado de este dispositivo', () => {
    const shifts = [
      { id: 'a', deviceCode: 'B2', status: 'open' as const },
      { id: 'b', deviceCode: 'A1', status: 'closed' as const },
      { id: 'c', deviceCode: 'A1', status: 'closing' as const },
    ];
    expect(currentShiftFor(shifts, 'A1')?.id).toBe('c');
    expect(currentShiftFor(shifts, 'Z9')).toBeNull();
  });
});
