export type NumpadKey =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '00' | ',' | 'backspace' | 'clear';

export interface NumpadOptions {
  allowDecimal: boolean;
  maxLength: number;
}

/** Aplica una tecla del numpad al texto actual. Función pura (probada aparte de la UI). */
export function applyNumpadKey(value: string, key: NumpadKey, options: NumpadOptions): string {
  if (key === 'clear') return '';
  if (key === 'backspace') return value.slice(0, -1);
  if (key === ',') {
    if (!options.allowDecimal || value.includes(',')) return value;
    return value === '' ? '0,' : `${value},`;
  }
  const next = value === '0' ? key.replace(/^0+/, '') || '0' : value + key;
  if (value === '' && key === '00') return '0';
  return next.length > options.maxLength ? value : next;
}
