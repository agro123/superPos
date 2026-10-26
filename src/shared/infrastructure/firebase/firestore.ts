import {
  onSnapshot,
  serverTimestamp,
  type DocumentReference,
  type FieldValue,
  type Query,
} from 'firebase/firestore';
import { SCHEMA_VERSION } from '@/shared/domain/audit';
import type { LiveDoc, Subscribe, Synced } from '@/shared/domain/live';
import { mapFirebaseError } from './errors';

export interface CreateAudit {
  createdAt: FieldValue;
  updatedAt: FieldValue;
  createdBy: string;
  schemaVersion: number;
}

/** Auditoría de creación. `serverTimestamp()` funciona offline y las reglas lo comparan con `request.time`. */
export function createAudit(uid: string): CreateAudit {
  return {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    schemaVersion: SCHEMA_VERSION,
  };
}

export function updateAudit(): { updatedAt: FieldValue } {
  return { updatedAt: serverTimestamp() };
}

/** Escucha un documento tipado (la referencia debe llevar su converter). */
export function watchDoc<T>(ref: DocumentReference<T>): Subscribe<LiveDoc<T>> {
  return (onNext, onError) =>
    onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snapshot) => {
        onNext({
          value: snapshot.exists() ? snapshot.data() : null,
          fromCache: snapshot.metadata.fromCache,
        });
      },
      (error) => {
        onError(mapFirebaseError(error));
      },
    );
}

/** Espera máxima por la respuesta del servidor antes de mostrar una caché posiblemente incompleta. */
const CACHE_GRACE_MS = 1500;

/**
 * Escucha una consulta tipada; cada fila indica si tiene escrituras locales sin confirmar.
 * Con conexión, la primera instantánea solo-caché puede estar incompleta (p. ej. un rango de
 * fechas más amplio que lo cacheado): se espera brevemente la del servidor. Sin conexión, la
 * caché se entrega de inmediato (offline-first).
 */
export function watchQuery<T>(query: Query<T>): Subscribe<Synced<T>[]> {
  return (onNext, onError) => {
    let delivered = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true },
      (snapshot) => {
        clearTimeout(timer);
        const emit = () => {
          delivered = true;
          onNext(
            snapshot.docs.map((doc) => ({
              ...doc.data(),
              pendingSync: doc.metadata.hasPendingWrites,
            })),
          );
        };
        if (delivered || !snapshot.metadata.fromCache || !navigator.onLine) emit();
        else timer = setTimeout(emit, CACHE_GRACE_MS);
      },
      (error) => {
        onError(mapFirebaseError(error));
      },
    );
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  };
}
