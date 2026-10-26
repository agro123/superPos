import { useEffect } from 'react';
import { AppError } from '@/shared/domain/errors';
import type { LiveDoc } from '@/shared/domain/live';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import type { SessionStatus, SessionUser } from '../domain/session';
import type { UserProfile } from '../domain/userProfile';
import { subscribeToSession } from '../infrastructure/authService';
import { watchUserProfile } from '../infrastructure/userProfileRepository';
import { useLockStore, useSessionStore } from './sessionStore';

/** Conecta Firebase Auth con el estado de sesión. Se monta una vez en `app/`. */
export function useAuthListener(): void {
  const setUser = useSessionStore((state) => state.setUser);
  useEffect(() => subscribeToSession(setUser), [setUser]);
}

export function useSession(): { status: SessionStatus; user: SessionUser | null } {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  return { status, user };
}

/** Usuario autenticado. Solo usar bajo la guarda `RequireAuth`. */
export function useCurrentUser(): SessionUser {
  const user = useSessionStore((state) => state.user);
  if (!user) throw new AppError('unauthenticated', 'useCurrentUser fuera de RequireAuth');
  return user;
}

/** Perfil global `users/{uid}` en tiempo real. */
export function useUserProfile(uid: string | null) {
  return useLiveQuery<LiveDoc<UserProfile>>(
    ['userProfile', uid],
    uid ? watchUserProfile(uid) : null,
  );
}

/** `true` si la pantalla del usuario actual está bloqueada con PIN. */
export function useIsLocked(): boolean {
  const uid = useSessionStore((state) => state.user?.uid);
  const lockedUid = useLockStore((state) => state.lockedUid);
  return uid !== undefined && lockedUid === uid;
}
