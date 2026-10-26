import { describe, expect, it } from 'vitest';
import { applyNumpadKey } from './numpadModel';

const opts = { allowDecimal: true, maxLength: 6 };

describe('applyNumpadKey', () => {
  it('agrega dígitos y respeta la longitud máxima', () => {
    expect(applyNumpadKey('12', '3', opts)).toBe('123');
    expect(applyNumpadKey('123456', '7', opts)).toBe('123456');
    expect(applyNumpadKey('5', '00', opts)).toBe('500');
  });

  it('evita ceros a la izquierda', () => {
    expect(applyNumpadKey('', '00', opts)).toBe('0');
    expect(applyNumpadKey('0', '5', opts)).toBe('5');
    expect(applyNumpadKey('0', '00', opts)).toBe('0');
  });

  it('maneja la coma decimal una sola vez', () => {
    expect(applyNumpadKey('', ',', opts)).toBe('0,');
    expect(applyNumpadKey('1,5', ',', opts)).toBe('1,5');
    expect(applyNumpadKey('1', ',', { ...opts, allowDecimal: false })).toBe('1');
  });

  it('borra y limpia', () => {
    expect(applyNumpadKey('123', 'backspace', opts)).toBe('12');
    expect(applyNumpadKey('123', 'clear', opts)).toBe('');
  });
});
