/** Estado global de sincronización que ve el usuario (docs/architecture/offline-sync.md). */
export type SyncState = 'online' | 'offline' | 'syncing' | 'error';

export interface SyncSignals {
  /** `navigator.onLine` y eventos online/offline. */
  online: boolean;
  /** Escrituras de Firestore aún no confirmadas por el servidor. */
  pendingWrites: number;
  /** `true` mientras se espera `waitForPendingWrites` tras arrancar con cambios encolados. */
  startupPending: boolean;
  /** Operaciones del outbox propio en cola. */
  outboxPending: number;
  /** Operaciones del outbox que agotaron sus reintentos. */
  outboxFailed: number;
}

export interface SyncSummary {
  state: SyncState;
  /** Cambios pendientes conocidos (`null` si solo se sabe que hay pendientes). */
  pendingCount: number | null;
}

/** Reduce las señales de sincronización a un único estado visible. El error tiene prioridad. */
export function deriveSyncState(signals: SyncSignals): SyncSummary {
  const known = signals.pendingWrites + signals.outboxPending;
  if (signals.outboxFailed > 0)
    return { state: 'error', pendingCount: known + signals.outboxFailed };
  if (!signals.online) return { state: 'offline', pendingCount: known };
  if (known > 0) return { state: 'syncing', pendingCount: known };
  if (signals.startupPending) return { state: 'syncing', pendingCount: null };
  return { state: 'online', pendingCount: 0 };
}
