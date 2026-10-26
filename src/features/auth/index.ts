/** API pública de la feature auth. */
export {
  useAuthListener,
  useCurrentUser,
  useIsLocked,
  useSession,
  useUserProfile,
} from './application/useSession';
export { useLockStore } from './application/sessionStore';
export {
  useRefreshVerification,
  useResendVerification,
  useSignOut,
} from './application/useAuthActions';
export type { SessionStatus, SessionUser } from './domain/session';
export type { UserProfile } from './domain/userProfile';

/** Pantallas con carga diferida (el router las importa bajo demanda). */
export const authPages = {
  login: () => import('./pages/LoginPage'),
  lock: () => import('./pages/LockPage'),
};
