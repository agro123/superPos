import { useEffect, useRef } from 'react';

/** Atajo de teclado global de escritorio (p. ej. "F2"). Ignora repeticiones. */
export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  enabled = true,
): void {
  const callback = useRef(handler);
  useEffect(() => {
    callback.current = handler;
  });
  useEffect(() => {
    if (!enabled) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key || event.repeat) return;
      event.preventDefault();
      callback.current(event);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, enabled]);
}
