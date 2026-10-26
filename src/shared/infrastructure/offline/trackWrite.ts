import { logger } from '@/shared/lib/logger';
import { mapFirebaseError } from '../firebase/errors';
import { useSyncStore } from './syncStore';

/**
 * Registra una escritura de Firestore sin bloquear la UI.
 * Sin conexión, la promesa de Firestore no se resuelve hasta sincronizar: NUNCA se espera en la UI
 * (offline-first). El contador alimenta el indicador global; un rechazo posterior
 * (p. ej. reglas) se publica en `lastError`.
 */
export function trackWrite(write: Promise<unknown>, context: string): void {
  const store = useSyncStore.getState();
  store.writeStarted();
  write.then(
    () => {
      useSyncStore.getState().writeSettled();
    },
    (error: unknown) => {
      const appError = mapFirebaseError(error);
      logger.error('Escritura rechazada', { context, code: appError.code });
      useSyncStore.getState().writeSettled(appError);
    },
  );
}
