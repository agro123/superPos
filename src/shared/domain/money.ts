import { AppError } from './errors';

/**
 * Dinero en enteros de la unidad mínima de la moneda (centavos), nunca en coma flotante (L10).
 * El formateo vive solo en la UI (`shared/lib/formatters`).
 */
export type Money = number & { readonly __brand: 'Money' };

export const CURRENCY_CODES = ['COP', 'USD', 'MXN', 'PEN', 'CLP', 'EUR'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/** Decimales de la unidad mínima según ISO 4217. */
export const CURRENCY_MINOR_UNITS: Readonly<Record<CurrencyCode, number>> = {
  COP: 2,
  USD: 2,
  MXN: 2,
  PEN: 2,
  CLP: 0,
  EUR: 2,
};

/** Base de las tasas en puntos básicos: 1900 bps = 19 %. */
export const BPS_BASE = 10_000;

/** Crea un `Money` validando que sea un entero seguro. */
export function money(minorUnits: number): Money {
  if (!Number.isSafeInteger(minorUnits)) {
    throw new AppError('invalid_money', `Monto inválido: ${minorUnits}`, {
      details: { minorUnits },
    });
  }
  return minorUnits as Money;
}

export const ZERO_MONEY: Money = money(0);

/** División entera con redondeo "half away from zero", exacta para enteros seguros. */
export function roundDiv(numerator: number, denominator: number): number {
  const quotient = Math.trunc(numerator / denominator);
  const remainder = numerator - quotient * denominator;
  return 2 * Math.abs(remainder) >= Math.abs(denominator)
    ? quotient + Math.sign(numerator) * Math.sign(denominator)
    : quotient;
}

export function addMoney(...values: readonly Money[]): Money {
  return money(values.reduce<number>((total, value) => total + value, 0));
}

export function subtractMoney(a: Money, b: Money): Money {
  return money(a - b);
}

/** Cantidades con hasta 3 decimales (p. ej. 1.25 kg). */
export const QUANTITY_SCALE = 1000;

/** Convierte una cantidad decimal a milésimas enteras, validando la precisión. */
export function quantityToMilli(quantity: number): number {
  const milli = Math.round(quantity * QUANTITY_SCALE);
  if (!Number.isFinite(quantity) || Math.abs(milli - quantity * QUANTITY_SCALE) > 1e-6) {
    throw new AppError('validation', `Cantidad inválida: ${quantity}`, { details: { quantity } });
  }
  return milli;
}

/** Precio unitario × cantidad, redondeado a la unidad mínima. */
export function multiplyMoney(unit: Money, quantity: number): Money {
  return money(roundDiv(unit * quantityToMilli(quantity), QUANTITY_SCALE));
}

/** Aplica una tasa en puntos básicos (impuesto exclusivo, descuento porcentual). */
export function applyRateBps(amount: Money, rateBps: number): Money {
  return money(roundDiv(amount * rateBps, BPS_BASE));
}

/** Impuesto contenido en un monto que ya lo incluye: `gross − gross / (1 + r)`. */
export function taxIncludedIn(gross: Money, rateBps: number): Money {
  const net = roundDiv(gross * BPS_BASE, BPS_BASE + rateBps);
  return money(gross - net);
}

export function toMajorUnits(amount: Money, currency: CurrencyCode): number {
  return amount / 10 ** CURRENCY_MINOR_UNITS[currency];
}

/** Convierte unidades mayores (p. ej. pesos) a `Money`, redondeando a la unidad mínima. */
export function fromMajorUnits(major: number, currency: CurrencyCode): Money {
  if (!Number.isFinite(major)) {
    throw new AppError('invalid_money', `Monto inválido: ${major}`, { details: { major } });
  }
  const factor = 10 ** CURRENCY_MINOR_UNITS[currency];
  // toPrecision(15) descarta el ruido binario (1.005 * 100 = 100.49999…) antes de redondear.
  const scaled = Number((Math.abs(major) * factor).toPrecision(15));
  return money(Math.sign(major) * Math.round(scaled));
}

export function isMoney(value: unknown): value is Money {
  return typeof value === 'number' && Number.isSafeInteger(value);
}
