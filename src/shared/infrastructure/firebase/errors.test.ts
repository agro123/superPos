import { FirebaseError } from 'firebase/app';
import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/domain/errors';
import { mapFirebaseError } from './errors';

describe('mapFirebaseError (L9)', () => {
  it('mapea por código, sin mirar el mensaje', () => {
    expect(mapFirebaseError(new FirebaseError('permission-denied', 'texto cualquiera')).code).toBe(
      'permission_denied',
    );
    expect(mapFirebaseError(new FirebaseError('auth/invalid-credential', 'x')).code).toBe(
      'unauthenticated',
    );
    expect(mapFirebaseError(new FirebaseError('auth/algo-nuevo', 'not-found')).code).toBe(
      'unknown',
    );
  });

  it('respeta los AppError y envuelve lo demás', () => {
    const original = new AppError('offline');
    expect(mapFirebaseError(original)).toBe(original);
    expect(mapFirebaseError(new Error('x')).code).toBe('unknown');
  });
});
