/** Códigos de error de la aplicación. Se decide por `code`, nunca por el texto del mensaje (L9). */
export const ERROR_CODES = [
  'unknown',
  'validation',
  'not_found',
  'unauthenticated',
  'permission_denied',
  'conflict',
  'invalid_transition',
  'invalid_money',
  'offline',
  'network',
  'config',
  'rate_limited',
  'locked',
  'payment_failed',
  'idempotency_conflict',
  'unsupported',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface AppErrorOptions {
  cause?: unknown;
  /** Datos estructurados para logs o para la UI (nunca secretos). */
  details?: Readonly<Record<string, unknown>>;
}

/** Error tipado de la aplicación. Toda capa lanza o devuelve `AppError`. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(code: ErrorCode, message?: string, options: AppErrorOptions = {}) {
    super(message ?? code, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.details = options.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Normaliza cualquier valor lanzado a `AppError`, conservando el original como `cause`. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  const message = error instanceof Error ? error.message : undefined;
  return new AppError('unknown', message, { cause: error });
}
