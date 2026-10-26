import { z } from 'zod';

/**
 * PIN de desbloqueo rápido (L2). Nunca se guarda en claro: se deriva con PBKDF2 + sal por usuario.
 * Es una comodidad sobre una sesión de Firebase Auth ya abierta, no una credencial principal (ADR 0008).
 */
export const PIN_LENGTH = { min: 4, max: 6 } as const;

const TRIVIAL_PINS = new Set([
  '0000',
  '1111',
  '1234',
  '4321',
  '123456',
  '000000',
  '111111',
  '654321',
]);

export const pinSchema = z
  .string()
  .regex(/^\d+$/, { error: 'Solo dígitos' })
  .min(PIN_LENGTH.min, { error: `Mínimo ${PIN_LENGTH.min} dígitos` })
  .max(PIN_LENGTH.max, { error: `Máximo ${PIN_LENGTH.max} dígitos` })
  .refine((pin) => !TRIVIAL_PINS.has(pin) && !/^(\d)\1+$/.test(pin), {
    error: 'PIN demasiado fácil',
  });

/** Credencial derivada que se persiste (en el dispositivo). */
export interface PinCredential {
  algorithm: 'PBKDF2-SHA256';
  iterations: number;
  /** Base64. */
  salt: string;
  /** Base64. */
  hash: string;
}

export interface LockoutState {
  failedAttempts: number;
  /** Epoch ms hasta el que está bloqueado, o `null`. */
  lockedUntil: number | null;
}

export const INITIAL_LOCKOUT: LockoutState = { failedAttempts: 0, lockedUntil: null };

/** Intentos libres antes del primer bloqueo. */
export const FREE_ATTEMPTS = 5;
const BASE_LOCK_MS = 30_000;
const MAX_LOCK_MS = 15 * 60_000;

export function isLocked(state: LockoutState, now: number): boolean {
  return state.lockedUntil !== null && now < state.lockedUntil;
}

/** Registra un intento fallido: a partir del 5.º, bloqueo exponencial (30 s, 60 s, … hasta 15 min). */
export function registerFailedAttempt(state: LockoutState, now: number): LockoutState {
  const failedAttempts = state.failedAttempts + 1;
  if (failedAttempts < FREE_ATTEMPTS) return { failedAttempts, lockedUntil: null };
  const lockMs = Math.min(BASE_LOCK_MS * 2 ** (failedAttempts - FREE_ATTEMPTS), MAX_LOCK_MS);
  return { failedAttempts, lockedUntil: now + lockMs };
}

/** Puerto: derivación y verificación del PIN (implementación WebCrypto en infrastructure). */
export interface PinHasher {
  derive(pin: string): Promise<PinCredential>;
  verify(pin: string, credential: PinCredential): Promise<boolean>;
}

/** Registro de PIN de un usuario en este dispositivo. */
export interface PinRecord {
  credential: PinCredential;
  lockout: LockoutState;
}

/** Puerto: almacenamiento local del PIN (nunca en claro). */
export interface PinStore {
  get(uid: string): Promise<PinRecord | null>;
  set(uid: string, record: PinRecord): Promise<void>;
  remove(uid: string): Promise<void>;
}
