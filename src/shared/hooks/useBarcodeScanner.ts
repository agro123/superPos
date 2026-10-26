import { useEffect, useRef } from 'react';

export interface BarcodeScannerOptions {
  /** Longitud mínima del código. */
  minLength?: number;
  /** Máximo de ms entre teclas para considerarlo un lector (un humano teclea más lento). */
  maxKeyIntervalMs?: number;
  enabled?: boolean;
}

/** Decide si una secuencia de teclas cronometradas parece un lector de código de barras. */
export function looksLikeScan(
  timestamps: readonly number[],
  minLength: number,
  maxIntervalMs: number,
): boolean {
  if (timestamps.length < minLength) return false;
  return timestamps.every(
    (time, index) => index === 0 || time - (timestamps[index - 1] ?? time) <= maxIntervalMs,
  );
}

/**
 * Detecta lectores de código de barras (teclado rápido + Enter) fuera de los campos de texto.
 * Dentro de un input, el buscador del POS ya maneja Enter.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  options: BarcodeScannerOptions = {},
): void {
  const { minLength = 6, maxKeyIntervalMs = 40, enabled = true } = options;
  const buffer = useRef<{ chars: string[]; times: number[] }>({ chars: [], times: [] });
  const callback = useRef(onScan);
  useEffect(() => {
    callback.current = onScan;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      const { target } = event;
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return;
      const state = buffer.current;
      if (event.key === 'Enter') {
        if (looksLikeScan(state.times, minLength, maxKeyIntervalMs))
          callback.current(state.chars.join(''));
        buffer.current = { chars: [], times: [] };
        return;
      }
      if (event.key.length === 1) {
        state.chars.push(event.key);
        state.times.push(event.timeStamp);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, minLength, maxKeyIntervalMs]);
}
