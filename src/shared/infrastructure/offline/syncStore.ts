import { create } from 'zustand';
import type { AppError } from '@/shared/domain/errors';
import type { SyncSignals } from '@/shared/domain/sync';

interface SyncStoreState extends SyncSignals {
  /** Último error de una escritura en segundo plano, para avisar al usuario. */
  lastError: AppError | null;
  setOnline: (online: boolean) => void;
  setStartupPending: (pending: boolean) => void;
  writeStarted: () => void;
  writeSettled: (error?: AppError) => void;
  setOutboxStats: (stats: { pending: number; failed: number }) => void;
  clearError: () => void;
}

/** Señales de sincronización (docs/architecture/offline-sync.md). Solo estado, sin efectos. */
export const useSyncStore = create<SyncStoreState>()((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pendingWrites: 0,
  startupPending: false,
  outboxPending: 0,
  outboxFailed: 0,
  lastError: null,
  setOnline: (online) => {
    set({ online });
  },
  setStartupPending: (startupPending) => {
    set({ startupPending });
  },
  writeStarted: () => {
    set((state) => ({ pendingWrites: state.pendingWrites + 1 }));
  },
  writeSettled: (error) => {
    set((state) => ({
      pendingWrites: Math.max(0, state.pendingWrites - 1),
      lastError: error ?? state.lastError,
    }));
  },
  setOutboxStats: ({ pending, failed }) => {
    set({ outboxPending: pending, outboxFailed: failed });
  },
  clearError: () => {
    set({ lastError: null });
  },
}));
