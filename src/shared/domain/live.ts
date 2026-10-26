import type { AppError } from './errors';

/** Suscripción en tiempo real (p. ej. `onSnapshot`) expresada sin depender de Firebase. */
export type Subscribe<T> = (
  onNext: (value: T) => void,
  onError: (error: AppError) => void,
) => () => void;

/** Documento leído en tiempo real, con su origen y estado de sincronización. */
export interface LiveDoc<T> {
  /** `null` si el documento no existe (o aún no está en la caché local). */
  value: T | null;
  /** `true` si viene solo de la caché local (posible sin conexión). */
  fromCache: boolean;
}

/** Entidad con marca de "pendiente de sincronizar" (escritura local no confirmada). */
export type Synced<T> = T & { pendingSync: boolean };
