import { describe, expect, it } from 'vitest';
import { loginInputSchema, signUpInputSchema } from './credentials';
import {
  INITIAL_LOCKOUT,
  isLocked,
  pinSchema,
  registerFailedAttempt,
  type LockoutState,
} from './pin';

describe('credenciales', () => {
  it('normaliza el email y exige contraseña', () => {
    expect(loginInputSchema.parse({ email: ' ANA@Ejemplo.co ', password: 'x' }).email).toBe(
      'ana@ejemplo.co',
    );
    expect(loginInputSchema.safeParse({ email: 'ana@ejemplo.co', password: '' }).success).toBe(
      false,
    );
    expect(
      signUpInputSchema.safeParse({ displayName: 'Ana', email: 'a@b.co', password: 'corta' })
        .success,
    ).toBe(false);
  });
});

describe('pinSchema (L2)', () => {
  it('acepta 4–6 dígitos no triviales', () => {
    expect(pinSchema.safeParse('2580').success).toBe(true);
    expect(pinSchema.safeParse('739104').success).toBe(true);
  });

  it.each(['123', '1234567', '12a4', '1234', '7777'])('rechaza %s', (pin) => {
    expect(pinSchema.safeParse(pin).success).toBe(false);
  });
});

describe('bloqueo por intentos fallidos (L2)', () => {
  const failTimes = (n: number, now = 0): LockoutState =>
    Array.from({ length: n }).reduce<LockoutState>(
      (state) => registerFailedAttempt(state, now),
      INITIAL_LOCKOUT,
    );

  it('permite 4 intentos fallidos sin bloquear', () => {
    expect(isLocked(failTimes(4), 0)).toBe(false);
  });

  it('bloquea 30 s al 5.º intento y duplica después', () => {
    expect(failTimes(5).lockedUntil).toBe(30_000);
    expect(failTimes(6).lockedUntil).toBe(60_000);
    expect(isLocked(failTimes(5), 29_999)).toBe(true);
    expect(isLocked(failTimes(5), 30_000)).toBe(false);
  });

  it('el bloqueo máximo es de 15 minutos', () => {
    expect(failTimes(30).lockedUntil).toBe(15 * 60_000);
  });
});
