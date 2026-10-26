import { FirebaseError } from 'firebase/app';
import { AppError, isAppError, type ErrorCode } from '@/shared/domain/errors';

/** Mapeo por código de error de Firebase, nunca por el texto del mensaje (L9). */
const CODE_MAP: Readonly<Record<string, ErrorCode>> = {
  'permission-denied': 'permission_denied',
  unauthenticated: 'unauthenticated',
  'not-found': 'not_found',
  'already-exists': 'conflict',
  'failed-precondition': 'conflict',
  'resource-exhausted': 'rate_limited',
  unavailable: 'network',
  'deadline-exceeded': 'network',
  'auth/invalid-credential': 'unauthenticated',
  'auth/wrong-password': 'unauthenticated',
  'auth/user-not-found': 'unauthenticated',
  'auth/user-disabled': 'permission_denied',
  'auth/email-already-in-use': 'conflict',
  'auth/too-many-requests': 'rate_limited',
  'auth/network-request-failed': 'network',
  'auth/weak-password': 'validation',
  'auth/invalid-email': 'validation',
  'storage/unauthorized': 'permission_denied',
  'storage/retry-limit-exceeded': 'network',
};

export function mapFirebaseError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof FirebaseError) {
    return new AppError(CODE_MAP[error.code] ?? 'unknown', error.message, {
      cause: error,
      details: { firebaseCode: error.code },
    });
  }
  return new AppError('unknown', error instanceof Error ? error.message : undefined, {
    cause: error,
  });
}
