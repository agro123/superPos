// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveSeedTarget } from './seedGuard';

describe('resolveSeedTarget (L13)', () => {
  it('usa los emuladores locales por defecto', () => {
    expect(resolveSeedTarget({})).toEqual({
      projectId: 'demo-superpos',
      firestoreHost: '127.0.0.1:8080',
      authHost: '127.0.0.1:9099',
    });
  });

  it('aborta con un proyecto real', () => {
    expect(() => resolveSeedTarget({ GCLOUD_PROJECT: 'superpos-prod' })).toThrow(/demo-/);
  });

  it('aborta con hosts remotos o credenciales de servicio', () => {
    expect(() =>
      resolveSeedTarget({ FIRESTORE_EMULATOR_HOST: 'firestore.googleapis.com:443' }),
    ).toThrow(/locales/);
    expect(() => resolveSeedTarget({ GOOGLE_APPLICATION_CREDENTIALS: '/tmp/key.json' })).toThrow(
      /credenciales/,
    );
  });
});
