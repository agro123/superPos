import { waitForPendingWrites } from 'firebase/firestore';
import { getFirebase } from '../firebase/app';
import { Outbox } from './outbox';
import { useSyncStore } from './syncStore';

const OUTBOX_INTERVAL_MS = 30_000;

let outbox: Outbox | null = null;

/** Outbox de la app; publica sus contadores en el indicador de sincronización. */
export function getOutbox(): Outbox {
  outbox ??= new Outbox({
    onChange: (stats) => {
      useSyncStore.getState().setOutboxStats(stats);
    },
  });
  return outbox;
}

/**
 * Arranca el monitoreo de conectividad y sincronización. Devuelve la función de limpieza.
 * - online/offline del navegador → estado global y reintento del outbox.
 * - `waitForPendingWrites` → "sincronizando" mientras haya escrituras de sesiones anteriores.
 */
export function startSyncMonitor(): () => void {
  const store = useSyncStore.getState();
  const handleConnectivity = () => {
    store.setOnline(navigator.onLine);
    if (navigator.onLine) void getOutbox().processDue();
  };
  window.addEventListener('online', handleConnectivity);
  window.addEventListener('offline', handleConnectivity);
  const interval = window.setInterval(() => void getOutbox().processDue(), OUTBOX_INTERVAL_MS);

  store.setStartupPending(true);
  void waitForPendingWrites(getFirebase().db).finally(() => {
    store.setStartupPending(false);
  });
  handleConnectivity();
  void getOutbox().stats().then(store.setOutboxStats);

  return () => {
    window.removeEventListener('online', handleConnectivity);
    window.removeEventListener('offline', handleConnectivity);
    window.clearInterval(interval);
  };
}
