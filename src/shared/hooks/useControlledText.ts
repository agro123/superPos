import { useState } from 'react';

/**
 * Mantiene el texto editable de un input numérico sincronizado con su valor controlado,
 * sin pisar lo que el usuario está escribiendo ("1," mientras escribe "1,5").
 */
export function useControlledText<T>(
  value: T | null,
  format: (value: T) => string,
  parse: (text: string) => T | null,
): [string, (text: string) => void] {
  const [text, setText] = useState(() => (value === null ? '' : format(value)));
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    if (parse(text) !== value) setText(value === null ? '' : format(value));
  }
  return [text, setText];
}
