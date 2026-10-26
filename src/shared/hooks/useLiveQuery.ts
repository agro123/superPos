import {
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Subscribe } from '@/shared/domain/live';

export type { Subscribe };

/** Espera el primer valor de una suscripción y la cierra. */
function firstValue<T>(subscribe: Subscribe<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // La suscripción puede emitir antes de devolver su función de cancelación.
    const state: { settled: boolean; unsubscribe: (() => void) | null } = {
      settled: false,
      unsubscribe: null,
    };
    const finish = () => {
      state.settled = true;
      state.unsubscribe?.();
    };
    state.unsubscribe = subscribe(
      (value) => {
        finish();
        resolve(value);
      },
      (error) => {
        finish();
        reject(error);
      },
    );
    if (state.settled) state.unsubscribe();
  });
}

/**
 * Datos en tiempo real dentro de la caché de TanStack Query.
 * La primera carga usa `useQuery` (estados de carga y error); una suscripción viva mantiene
 * la caché actualizada. Firestore comparte el listener entre suscripciones idénticas.
 */
export function useLiveQuery<T>(
  queryKey: QueryKey,
  subscribe: Subscribe<T> | null,
): UseQueryResult<T> {
  const queryClient = useQueryClient();
  const hash = JSON.stringify(queryKey);

  useEffect(() => {
    if (!subscribe) return undefined;
    return subscribe(
      (value) => {
        queryClient.setQueryData(queryKey, value);
      },
      () => {
        void queryClient.refetchQueries({ queryKey, exact: true });
      },
    );
    // `hash` representa a `queryKey`; `subscribe` se reconstruye en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, subscribe === null, queryClient]);

  return useQuery<T>({
    queryKey,
    queryFn: () => (subscribe ? firstValue(subscribe) : Promise.reject(new Error('disabled'))),
    enabled: subscribe !== null,
    staleTime: Infinity,
    retry: false,
  });
}
