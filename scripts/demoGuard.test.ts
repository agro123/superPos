import { describe, expect, it } from 'vitest';
import { resolveDemoTarget } from './demoGuard';

const ok = {
  DEMO_PROJECT_ID: 'superpos-univalle',
  DEMO_CONFIRM: 'superpos-univalle',
  GOOGLE_APPLICATION_CREDENTIALS: '/tmp/sa.json',
  DEMO_PASSWORD: 'Demo-segura-2026',
};

describe('resolveDemoTarget', () => {
  it('exige proyecto real, confirmación, credenciales y contraseña propia', () => {
    expect(resolveDemoTarget(ok)).toEqual({
      projectId: 'superpos-univalle',
      password: ok.DEMO_PASSWORD,
    });
    expect(() =>
      resolveDemoTarget({ ...ok, DEMO_PROJECT_ID: 'demo-superpos', DEMO_CONFIRM: 'demo-superpos' }),
    ).toThrow();
    expect(() => resolveDemoTarget({ ...ok, DEMO_CONFIRM: 'si' })).toThrow(/DEMO_CONFIRM/);
    expect(() => resolveDemoTarget({ ...ok, GOOGLE_APPLICATION_CREDENTIALS: undefined })).toThrow(
      /CREDENTIALS/,
    );
    expect(() => resolveDemoTarget({ ...ok, DEMO_PASSWORD: 'superpos123' })).toThrow(
      /DEMO_PASSWORD/,
    );
    expect(() => resolveDemoTarget({ ...ok, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' })).toThrow(
      /emulador/,
    );
  });
});
