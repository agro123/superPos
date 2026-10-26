import {
  Timestamp,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore';
import type { z } from 'zod';
import { AppError } from '@/shared/domain/errors';

/** Convierte recursivamente `Timestamp` de Firestore a `Date` del dominio. */
export function timestampsToDates(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(timestampsToDates);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, timestampsToDates(item)]),
    );
  }
  return value;
}

/**
 * Converter tipado con Zod: valida en lectura y quita `id` en escritura.
 * Las escrituras validan su entrada con el esquema `*Input` antes de llegar aquí.
 * Las marcas de tiempo pendientes (`serverTimestamp` sin confirmar) se leen como estimación local.
 */
export function zodConverter<T extends { id: string }>(
  schema: z.ZodType<T>,
): FirestoreDataConverter<T> {
  return {
    toFirestore(entity) {
      const { id: _id, ...data } = entity;
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): T {
      const raw = snapshot.data({ ...options, serverTimestamps: 'estimate' });
      const parsed = schema.safeParse({ ...(timestampsToDates(raw) as object), id: snapshot.id });
      if (!parsed.success) {
        throw new AppError('validation', `Documento inválido: ${snapshot.ref.path}`, {
          cause: parsed.error,
          details: { path: snapshot.ref.path },
        });
      }
      return parsed.data;
    },
  };
}
