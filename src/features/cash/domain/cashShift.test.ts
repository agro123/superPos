import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { cashDifference, cashShiftMachine, expectedCash } from './cashShift';

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
