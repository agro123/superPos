import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRateBps,
  moneyToInputText,
  parseMoneyInput,
} from './formatters';

const nbsp = new RegExp(String.fromCharCode(0xa0), 'g');

describe('formatMoney', () => {
  it('formatea COP sin centavos y USD con 2 decimales', () => {
    expect(formatMoney(money(250000), 'COP').replace(nbsp, ' ')).toBe('$ 2.500');
    expect(formatMoney(money(250050), 'COP').replace(nbsp, ' ')).toBe('$ 2.500,50');
    expect(formatMoney(money(1999), 'USD', 'en-US')).toBe('$19.99');
  });
});

describe('otros formatos', () => {
  it('formatea números, tasas y fechas en la zona del negocio', () => {
    expect(formatNumber(1234.5)).toBe('1.234,5');
    expect(formatRateBps(1900).replace(nbsp, ' ')).toMatch(/^19 ?%$/);
    const date = new Date(Date.UTC(2026, 0, 1, 3, 0));
    expect(formatDateTime(date, 'America/Bogota')).toContain('2025');
  });
});

describe('parseMoneyInput', () => {
  it('interpreta separadores de es-CO', () => {
    expect(parseMoneyInput('12.500', 'COP')).toBe(1250000);
    expect(parseMoneyInput('$ 12.500,5', 'COP')).toBe(1250050);
    expect(parseMoneyInput('19,99', 'USD')).toBe(1999);
  });

  it('rechaza texto inválido o con demasiados decimales', () => {
    expect(parseMoneyInput('abc', 'COP')).toBeNull();
    expect(parseMoneyInput('', 'COP')).toBeNull();
    expect(parseMoneyInput('1,234', 'USD')).toBeNull();
  });

  it('genera texto editable', () => {
    expect(moneyToInputText(money(1250000), 'COP')).toBe('12500');
    expect(moneyToInputText(money(1999), 'USD')).toBe('19,99');
  });
});
