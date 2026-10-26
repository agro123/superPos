import type { LiveDoc } from '@/shared/domain/live';
import type { SessionStatus } from '@/features/auth';

export type SessionAccess = 'loading' | 'login' | 'ready';

export function resolveSessionAccess(status: SessionStatus): SessionAccess {
  if (status === 'loading') return 'loading';
  return status === 'signedOut' ? 'login' : 'ready';
}

export type BusinessAccess =
  | { kind: 'loading' }
  | { kind: 'error' }
  /** Sin red y sin el perfil en la caché local. */
  | { kind: 'offline' }
  | { kind: 'redirect'; to: '/onboarding' | '/select-business' | '/platform' }
  /** Pertenece a un solo negocio: se activa automáticamente. */
  | { kind: 'select'; businessId: string }
  | { kind: 'ready'; businessId: string };

export interface BusinessAccessInput {
  profile: LiveDoc<{ businessIds: readonly string[] }> | undefined;
  profileError: boolean;
  activeBusinessId: string | null;
  /** El super admin sin negocios propios va a la administración de la plataforma. */
  platformAdmin?: boolean;
}

/**
 * Decide a dónde va un usuario autenticado según su perfil y el negocio activo.
 * `businessIds` es un índice de conveniencia: la pertenencia real se valida después con `members`.
 */
export function resolveBusinessAccess({
  profile,
  profileError,
  activeBusinessId,
  platformAdmin = false,
}: BusinessAccessInput): BusinessAccess {
  const home = platformAdmin ? '/platform' : '/onboarding';
  if (profileError) return { kind: 'error' };
  if (!profile) return { kind: 'loading' };
  if (!profile.value)
    return profile.fromCache ? { kind: 'offline' } : { kind: 'redirect', to: home };
  const ids = profile.value.businessIds;
  if (activeBusinessId && ids.includes(activeBusinessId))
    return { kind: 'ready', businessId: activeBusinessId };
  if (ids.length === 0) return { kind: 'redirect', to: home };
  const [only] = ids;
  if (ids.length === 1 && only) return { kind: 'select', businessId: only };
  return { kind: 'redirect', to: '/select-business' };
}
