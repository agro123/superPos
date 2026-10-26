import { AppError } from '@/shared/domain/errors';
import { err, ok, type Result } from '@/shared/domain/result';
import {
  INITIAL_LOCKOUT,
  isLocked,
  pinSchema,
  registerFailedAttempt,
  type PinHasher,
  type PinStore,
} from '../domain/pin';

/** Servicio de PIN de desbloqueo rápido (L2). */
export interface PinService {
  hasPin(uid: string): Promise<boolean>;
  /** Valida la política de PIN, lo deriva y lo guarda. */
  setPin(uid: string, pin: string): Promise<Result<void>>;
  /** Verifica respetando el bloqueo por intentos (`locked` con `details.lockedUntil`). */
  verify(uid: string, pin: string): Promise<Result<void>>;
  removePin(uid: string): Promise<void>;
}

export function createPinService(
  store: PinStore,
  hasher: PinHasher,
  now: () => number = Date.now,
): PinService {
  return {
    async hasPin(uid) {
      return (await store.get(uid)) !== null;
    },
    async setPin(uid, pin) {
      const parsed = pinSchema.safeParse(pin);
      if (!parsed.success) {
        return err(new AppError('validation', parsed.error.issues[0]?.message ?? 'PIN inválido'));
      }
      await store.set(uid, {
        credential: await hasher.derive(parsed.data),
        lockout: INITIAL_LOCKOUT,
      });
      return ok(undefined);
    },
    async verify(uid, pin) {
      const record = await store.get(uid);
      if (!record)
        return err(new AppError('not_found', 'No hay PIN configurado en este dispositivo'));
      if (isLocked(record.lockout, now())) {
        return err(
          new AppError('locked', 'Demasiados intentos', {
            details: { lockedUntil: record.lockout.lockedUntil },
          }),
        );
      }
      if (await hasher.verify(pin, record.credential)) {
        await store.set(uid, { ...record, lockout: INITIAL_LOCKOUT });
        return ok(undefined);
      }
      const lockout = registerFailedAttempt(record.lockout, now());
      await store.set(uid, { ...record, lockout });
      return err(
        lockout.lockedUntil
          ? new AppError('locked', 'Demasiados intentos', {
              details: { lockedUntil: lockout.lockedUntil },
            })
          : new AppError('unauthenticated', 'PIN incorrecto', {
              details: { failedAttempts: lockout.failedAttempts },
            }),
      );
    },
    async removePin(uid) {
      await store.remove(uid);
    },
  };
}
