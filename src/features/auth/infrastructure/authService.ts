import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { AppError } from '@/shared/domain/errors';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { mapFirebaseError } from '@/shared/infrastructure/firebase/errors';
import type { LoginInput, PasswordResetInput, SignUpInput } from '../domain/credentials';
import type { SessionUser } from '../domain/session';
import { ensureUserProfile } from './userProfileRepository';

function toSessionUser(user: User, platformAdmin = false): SessionUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email ?? '',
    emailVerified: user.emailVerified,
    platformAdmin,
  };
}

/** Lee el claim del token en caché (no requiere red). */
async function readPlatformAdmin(user: User): Promise<boolean> {
  try {
    const { claims } = await user.getIdTokenResult();
    return claims.platformAdmin === true;
  } catch {
    return false;
  }
}

/**
 * Escucha la sesión. Usa `onIdTokenChanged` para enterarse también de la verificación del email
 * y de cambios en los custom claims.
 */
export function subscribeToSession(onChange: (user: SessionUser | null) => void): () => void {
  return onIdTokenChanged(getFirebase().auth, (user) => {
    if (!user) {
      onChange(null);
      return;
    }
    void readPlatformAdmin(user).then((platformAdmin) => {
      // Si la sesión cambió mientras se leía el token, esta respuesta ya es vieja.
      if (getFirebase().auth.currentUser?.uid !== user.uid) return;
      onChange(toSessionUser(user, platformAdmin));
    });
  });
}

async function run<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/** Iniciar sesión requiere red (documentado en docs/architecture/offline-sync.md). */
export function signIn(input: LoginInput): Promise<void> {
  return run(async () => {
    const credential = await signInWithEmailAndPassword(
      getFirebase().auth,
      input.email,
      input.password,
    );
    await ensureUserProfile(toSessionUser(credential.user));
  });
}

export function signUp(input: SignUpInput): Promise<void> {
  return run(async () => {
    const { user } = await createUserWithEmailAndPassword(
      getFirebase().auth,
      input.email,
      input.password,
    );
    await updateProfile(user, { displayName: input.displayName });
    await sendEmailVerification(user);
    await ensureUserProfile({ ...toSessionUser(user), displayName: input.displayName });
  });
}

export function signOut(): Promise<void> {
  return run(() => firebaseSignOut(getFirebase().auth));
}

export function sendPasswordReset(input: PasswordResetInput): Promise<void> {
  return run(() => sendPasswordResetEmail(getFirebase().auth, input.email));
}

function currentUser(): User {
  const user = getFirebase().auth.currentUser;
  if (!user) throw new AppError('unauthenticated');
  return user;
}

export function resendVerificationEmail(): Promise<void> {
  return run(() => sendEmailVerification(currentUser()));
}

/** Recarga el usuario y fuerza un token nuevo para que las reglas vean `email_verified`. */
export function refreshEmailVerification(): Promise<void> {
  return run(async () => {
    const user = currentUser();
    await reload(user);
    await user.getIdToken(true);
  });
}
