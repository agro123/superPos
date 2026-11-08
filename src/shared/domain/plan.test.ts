import { describe, expect, it } from 'vitest';
import { firstFreeSeat, PLAN_LIMITS, seatIdsFor } from './plan';

describe('planes', () => {
  it('gratis: 1 cupo y sin funciones premium; premium: 3 cupos', () => {
    expect(seatIdsFor('free')).toEqual(['1']);
    expect(seatIdsFor('premium')).toEqual(['1', '2', '3']);
    expect(PLAN_LIMITS.free).toMatchObject({
      customRoles: false,
      reports: false,
      exports: false,
      historyDays: 30,
    });
    expect(PLAN_LIMITS.premium).toMatchObject({ customRoles: true, reports: true, ai: true });
  });

  it('elige el primer cupo libre del plan', () => {
    expect(firstFreeSeat('premium', new Set(['1']))).toBe('2');
    expect(firstFreeSeat('free', new Set(['1']))).toBeNull();
    expect(firstFreeSeat('free', new Set())).toBe('1');
  });
});
