import { describe, expect, it } from 'vitest';
import { resolveBusinessAccess, resolveSessionAccess } from './access';

const profile = (businessIds: string[], fromCache = false) => ({
  value: { businessIds },
  fromCache,
});

describe('resolveSessionAccess', () => {
  it('espera, manda a login o deja pasar', () => {
    expect(resolveSessionAccess('loading')).toBe('loading');
    expect(resolveSessionAccess('signedOut')).toBe('login');
    expect(resolveSessionAccess('signedIn')).toBe('ready');
  });
});

describe('resolveBusinessAccess', () => {
  it('estados de carga, error y sin conexión', () => {
    expect(
      resolveBusinessAccess({ profile: undefined, profileError: false, activeBusinessId: null }),
    ).toEqual({ kind: 'loading' });
    expect(
      resolveBusinessAccess({ profile: undefined, profileError: true, activeBusinessId: null }),
    ).toEqual({ kind: 'error' });
    expect(
      resolveBusinessAccess({
        profile: { value: null, fromCache: true },
        profileError: false,
        activeBusinessId: null,
      }),
    ).toEqual({ kind: 'offline' });
  });

  it('sin negocios va al onboarding', () => {
    expect(
      resolveBusinessAccess({ profile: profile([]), profileError: false, activeBusinessId: null }),
    ).toEqual({ kind: 'redirect', to: '/onboarding' });
    expect(
      resolveBusinessAccess({
        profile: { value: null, fromCache: false },
        profileError: false,
        activeBusinessId: null,
      }),
    ).toEqual({
      kind: 'redirect',
      to: '/onboarding',
    });
  });

  it('con un solo negocio lo activa; con varios pide elegir', () => {
    expect(
      resolveBusinessAccess({
        profile: profile(['b1']),
        profileError: false,
        activeBusinessId: null,
      }),
    ).toEqual({ kind: 'select', businessId: 'b1' });
    expect(
      resolveBusinessAccess({
        profile: profile(['b1', 'b2']),
        profileError: false,
        activeBusinessId: null,
      }),
    ).toEqual({
      kind: 'redirect',
      to: '/select-business',
    });
  });

  it('respeta el negocio activo solo si sigue en el perfil', () => {
    expect(
      resolveBusinessAccess({
        profile: profile(['b1', 'b2']),
        profileError: false,
        activeBusinessId: 'b2',
      }),
    ).toEqual({ kind: 'ready', businessId: 'b2' });
    expect(
      resolveBusinessAccess({
        profile: profile(['b1', 'b2']),
        profileError: false,
        activeBusinessId: 'b9',
      }).kind,
    ).toBe('redirect');
  });
});

describe('super administrador', () => {
  it('sin negocios propios va a la administración de la plataforma', () => {
    expect(
      resolveBusinessAccess({
        profile: profile([]),
        profileError: false,
        activeBusinessId: null,
        platformAdmin: true,
      }),
    ).toEqual({ kind: 'redirect', to: '/platform' });
  });

  it('con negocios propios entra a su negocio como cualquier usuario', () => {
    expect(
      resolveBusinessAccess({
        profile: profile(['b1']),
        profileError: false,
        activeBusinessId: 'b1',
        platformAdmin: true,
      }),
    ).toEqual({ kind: 'ready', businessId: 'b1' });
  });
});
