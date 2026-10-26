import { describe, expect, it } from 'vitest';
import { deriveSyncState, type SyncSignals } from './sync';

const base: SyncSignals = {
  online: true,
  pendingWrites: 0,
  startupPending: false,
  outboxPending: 0,
  outboxFailed: 0,
};

describe('deriveSyncState', () => {
  it('en línea sin pendientes', () => {
    expect(deriveSyncState(base)).toEqual({ state: 'online', pendingCount: 0 });
  });

  it('sin conexión conserva el conteo de pendientes', () => {
    expect(deriveSyncState({ ...base, online: false, pendingWrites: 2, outboxPending: 1 })).toEqual(
      {
        state: 'offline',
        pendingCount: 3,
      },
    );
  });

  it('sincronizando con conteo conocido o desconocido', () => {
    expect(deriveSyncState({ ...base, pendingWrites: 4 }).state).toBe('syncing');
    expect(deriveSyncState({ ...base, startupPending: true })).toEqual({
      state: 'syncing',
      pendingCount: null,
    });
  });

  it('el error tiene prioridad sobre todo lo demás', () => {
    expect(deriveSyncState({ ...base, online: false, outboxFailed: 1 }).state).toBe('error');
  });
});
