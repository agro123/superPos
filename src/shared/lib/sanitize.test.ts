import { describe, expect, it } from 'vitest';
import { sanitizeText } from './sanitize';

describe('sanitizeText', () => {
  it('quita caracteres de control y limita la longitud', () => {
    expect(sanitizeText('  Café\u0007 con\u001b leche  ')).toBe('Café con leche');
    expect(sanitizeText('abcdef', 3)).toBe('abc');
    expect(sanitizeText('línea 1\nlínea 2')).toBe('línea 1\nlínea 2');
  });

  it('no interpreta HTML: lo deja como texto', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>');
  });
});
