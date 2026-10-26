import {
  CURRENCY_MINOR_UNITS,
  fromMajorUnits,
  toMajorUnits,
  type CurrencyCode,
  type Money,
} from '@/shared/domain/money';
import { DEFAULT_LOCALE } from './i18n';

/** Decimales que se muestran por defecto (el peso colombiano no usa centavos en la práctica). */
const DISPLAY_DECIMALS: Readonly<Record<CurrencyCode, number>> = {
  COP: 0,
  USD: 2,
  MXN: 2,
  PEN: 2,
  CLP: 0,
  EUR: 2,
};

/** `true` si la moneda se muestra con decimales (USD) y `false` si no (COP, CLP). */
export function currencyUsesDecimals(currency: CurrencyCode): boolean {
  return DISPLAY_DECIMALS[currency] > 0;
}

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function numberFormat(key: string, create: () => Intl.NumberFormat): Intl.NumberFormat {
  const cached = cache.get(key);
  if (cached instanceof Intl.NumberFormat) return cached;
  const created = create();
  cache.set(key, created);
  return created;
}

function dateFormat(key: string, create: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  const cached = cache.get(key);
  if (cached instanceof Intl.DateTimeFormat) return cached;
  const created = create();
  cache.set(key, created);
  return created;
}

/** Formatea dinero para mostrar. Muestra centavos solo si el monto los tiene. */
export function formatMoney(
  amount: Money,
  currency: CurrencyCode,
  locale = DEFAULT_LOCALE,
): string {
  const factor = 10 ** CURRENCY_MINOR_UNITS[currency];
  const digits =
    amount % factor === 0 ? DISPLAY_DECIMALS[currency] : CURRENCY_MINOR_UNITS[currency];
  const formatter = numberFormat(
    `money|${locale}|${currency}|${digits}`,
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }),
  );
  return formatter.format(toMajorUnits(amount, currency));
}

export function formatNumber(value: number, locale = DEFAULT_LOCALE): string {
  return numberFormat(
    `number|${locale}`,
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }),
  ).format(value);
}

/** 1900 bps → "19 %". */
export function formatRateBps(rateBps: number, locale = DEFAULT_LOCALE): string {
  return numberFormat(
    `percent|${locale}`,
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }),
  ).format(rateBps / 10_000);
}

export function formatDateTime(date: Date, timeZone: string, locale = DEFAULT_LOCALE): string {
  return dateFormat(
    `datetime|${locale}|${timeZone}`,
    () => new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'medium', timeStyle: 'short' }),
  ).format(date);
}

export function formatDate(date: Date, timeZone: string, locale = DEFAULT_LOCALE): string {
  return dateFormat(
    `date|${locale}|${timeZone}`,
    () => new Intl.DateTimeFormat(locale, { timeZone, day: '2-digit', month: 'short' }),
  ).format(date);
}

export function formatTime(date: Date, timeZone: string, locale = DEFAULT_LOCALE): string {
  return dateFormat(
    `time|${locale}|${timeZone}`,
    () => new Intl.DateTimeFormat(locale, { timeZone, timeStyle: 'short' }),
  ).format(date);
}

/** Separadores de miles y decimales del locale (es-CO: "." y ","). */
function separators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? '.',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? ',',
  };
}

/**
 * Interpreta un monto escrito por el usuario en unidades mayores ("12.500,50" en es-CO).
 * Devuelve `null` si el texto no es un número válido.
 */
export function parseMoneyInput(
  text: string,
  currency: CurrencyCode,
  locale = DEFAULT_LOCALE,
): Money | null {
  const { group, decimal } = separators(locale);
  const cleaned = text
    .replace(/[^\d.,-]/g, '')
    .split(group)
    .join('')
    .replace(decimal, '.');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const decimals = cleaned.split('.')[1]?.length ?? 0;
  if (decimals > CURRENCY_MINOR_UNITS[currency]) return null;
  return fromMajorUnits(Number(cleaned), currency);
}

/** Texto editable para un `MoneyInput` (sin símbolo de moneda ni separadores de miles). */
export function moneyToInputText(
  amount: Money,
  currency: CurrencyCode,
  locale = DEFAULT_LOCALE,
): string {
  const { decimal } = separators(locale);
  const major = toMajorUnits(amount, currency);
  return Number.isInteger(major)
    ? String(major)
    : major.toFixed(CURRENCY_MINOR_UNITS[currency]).replace('.', decimal);
}
