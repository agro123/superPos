import { FirebaseError } from 'firebase/app';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from './syncStore';
import { trackWrite } from './trackWrite';

describe('trackWrite', () => {
  beforeEach(() => {
    useSyncStore.setState({ pendingWrites: 0, lastError: null });
  });

  it('cuenta la escritura pendiente hasta que se confirma', async () => {
    let resolve: () => void = () => undefined;
    const write = new Promise<void>((r) => {
      resolve = r;
    });
    trackWrite(write, 'test');
    expect(useSyncStore.getState().pendingWrites).toBe(1);
    resolve();
    await write;
    await Promise.resolve();
    expect(useSyncStore.getState().pendingWrites).toBe(0);
  });

  it('publica el error mapeado si el servidor rechaza la escritura', async () => {
    const write = Promise.reject(new FirebaseError('permission-denied', 'no'));
    trackWrite(write, 'test');
    await write.catch(() => undefined);
    await Promise.resolve();
    expect(useSyncStore.getState().lastError?.code).toBe('permission_denied');
    expect(useSyncStore.getState().pendingWrites).toBe(0);
  });
});
