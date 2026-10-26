import { useShallow } from 'zustand/react/shallow';
import { deriveSyncState, type SyncSummary } from '@/shared/domain/sync';
import { useSyncStore } from '@/shared/infrastructure/offline/syncStore';

/** Estado global de sincronización para el indicador de la barra superior. */
export function useSyncSummary(): SyncSummary {
  const signals = useSyncStore(
    useShallow((state) => ({
      online: state.online,
      pendingWrites: state.pendingWrites,
      startupPending: state.startupPending,
      outboxPending: state.outboxPending,
      outboxFailed: state.outboxFailed,
    })),
  );
  return deriveSyncState(signals);
}

/** `true` si el navegador reporta conexión. */
export function useOnlineStatus(): boolean {
  return useSyncStore((state) => state.online);
}
