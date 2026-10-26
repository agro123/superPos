import { describe, expect, it } from 'vitest';
import { AppError } from './errors';
import {
  addMoney,
  applyRateBps,
  fromMajorUnits,
  isMoney,
  money,
  multiplyMoney,
  quantityToMilli,
  roundDiv,
  subtractMoney,
  taxIncludedIn,
  toMajorUnits,
  ZERO_MONEY,
} from './money';

describe('money', () => {
  it('acepta enteros seguros y rechaza decimales, NaN e infinitos', () => {
    expect(money(1500)).toBe(1500);
    expect(() => money(10.5)).toThrow(AppError);
    expect(() => money(Number.NaN)).toThrow(AppError);
    expect(() => money(Number.POSITIVE_INFINITY)).toThrow(AppError);
    expect(() => money(Number.MAX_SAFE_INTEGER + 1)).toThrow(AppError);
  });

  it('suma y resta en enteros', () => {
    expect(addMoney(money(10), money(20), money(30))).toBe(60);
    expect(addMoney()).toBe(ZERO_MONEY);
    expect(subtractMoney(money(100), money(30))).toBe(70);
  });

  it('evita errores de coma flotante (0.1 + 0.2)', () => {
    expect(addMoney(fromMajorUnits(0.1, 'USD'), fromMajorUnits(0.2, 'USD'))).toBe(30);
  });
});

describe('roundDiv', () => {
  it('redondea "half away from zero"', () => {
    expect(roundDiv(5, 2)).toBe(3);
    expect(roundDiv(-5, 2)).toBe(-3);
    expect(roundDiv(4, 3)).toBe(1);
    expect(roundDiv(-4, 3)).toBe(-1);
    expect(roundDiv(5, -2)).toBe(-3);
    expect(roundDiv(10, 5)).toBe(2);
  });
});

describe('multiplyMoney', () => {
  it('multiplica por cantidades enteras y decimales', () => {
    expect(multiplyMoney(money(2500), 3)).toBe(7500);
    expect(multiplyMoney(money(1999), 1.5)).toBe(2999); // 2998.5 → 2999
    expect(multiplyMoney(money(1000), 0.333)).toBe(333);
  });

  it('rechaza cantidades con más de 3 decimales', () => {
    expect(() => quantityToMilli(1.0005)).toThrow(AppError);
    expect(() => quantityToMilli(Number.NaN)).toThrow(AppError);
  });
});

describe('impuestos', () => {
  it('aplica una tasa exclusiva en puntos básicos', () => {
    expect(applyRateBps(money(10000), 1900)).toBe(1900);
    expect(applyRateBps(money(333), 1900)).toBe(63); // 63.27
  });

  it('extrae el impuesto incluido', () => {
    expect(taxIncludedIn(money(11900), 1900)).toBe(1900);
    expect(taxIncludedIn(money(1000), 0)).toBe(0);
  });
});

describe('conversión de unidades', () => {
  it('convierte entre unidades mayores y mínimas según la moneda', () => {
    expect(fromMajorUnits(2500, 'COP')).toBe(250000);
    expect(fromMajorUnits(1.005, 'USD')).toBe(101);
    expect(fromMajorUnits(-2.5, 'USD')).toBe(-250);
    expect(fromMajorUnits(990, 'CLP')).toBe(990);
    expect(toMajorUnits(money(250000), 'COP')).toBe(2500);
    expect(() => fromMajorUnits(Number.NaN, 'COP')).toThrow(AppError);
  });

  it('isMoney reconoce enteros seguros', () => {
    expect(isMoney(10)).toBe(true);
    expect(isMoney(1.5)).toBe(false);
    expect(isMoney('10')).toBe(false);
  });
});
