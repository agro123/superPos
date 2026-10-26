type Level = 'info' | 'warn' | 'error';

/**
 * Logger mínimo con contexto estructurado. No registrar PII, PINs ni tokens.
 * Punto único para conectar un servicio de observabilidad más adelante.
 */
function log(level: Level, message: string, context?: Record<string, unknown>): void {
  if (import.meta.env.MODE === 'test') return;
  const payload = context ? [message, context] : [message];
  if (level === 'error') console.error('[superpos]', ...payload);
  else if (level === 'warn') console.warn('[superpos]', ...payload);
  else console.info('[superpos]', ...payload);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    log('info', message, context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    log('warn', message, context);
  },
  error: (message: string, context?: Record<string, unknown>) => {
    log('error', message, context);
  },
};
