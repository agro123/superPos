import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/domain/errors';
import { readEnv } from './env';

const valid = {
  VITE_FIREBASE_API_KEY: 'k',
  VITE_FIREBASE_AUTH_DOMAIN: 'd',
  VITE_FIREBASE_PROJECT_ID: 'mi-proyecto',
  VITE_FIREBASE_STORAGE_BUCKET: 'b',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
  VITE_FIREBASE_APP_ID: 'a',
};

describe('readEnv', () => {
  it('aplica valores por defecto', () => {
    expect(readEnv(valid)).toMatchObject({
      VITE_USE_EMULATORS: false,
      VITE_EMULATOR_HOST: '127.0.0.1',
      VITE_APP_CHECK_SITE_KEY: '',
    });
  });

  it('falla con AppError config si falta algo', () => {
    expect(() => readEnv({ ...valid, VITE_FIREBASE_API_KEY: '' })).toThrow(AppError);
  });

  it('un proyecto demo exige emuladores', () => {
    expect(() => readEnv({ ...valid, VITE_FIREBASE_PROJECT_ID: 'demo-x' })).toThrow(
      /emuladores|EMULATORS/,
    );
    expect(
      readEnv({ ...valid, VITE_FIREBASE_PROJECT_ID: 'demo-x', VITE_USE_EMULATORS: 'true' })
        .VITE_USE_EMULATORS,
    ).toBe(true);
  });
});
