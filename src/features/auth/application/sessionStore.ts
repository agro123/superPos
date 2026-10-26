import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SessionStatus, SessionUser } from '../domain/session';

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
}

/** Sesión actual (espejo de Firebase Auth). */
export const useSessionStore = create<SessionState>()((set) => ({
  status: 'loading',
  user: null,
  setUser: (user) => {
    set({ user, status: user ? 'signedIn' : 'signedOut' });
  },
}));

interface LockState {
  /** Usuario cuya pantalla está bloqueada (sobrevive a recargas). */
  lockedUid: string | null;
  lock: (uid: string) => void;
  unlock: () => void;
}

export const useLockStore = create<LockState>()(
  persist(
    (set) => ({
      lockedUid: null,
      lock: (uid) => {
        set({ lockedUid: uid });
      },
      unlock: () => {
        set({ lockedUid: null });
      },
    }),
    { name: 'superpos.lock', storage: createJSONStorage(() => localStorage) },
  ),
);
