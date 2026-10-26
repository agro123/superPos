import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/domain/errors';
import { useLiveQuery, type Subscribe } from './useLiveQuery';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useLiveQuery', () => {
  it('entrega el primer valor y luego las actualizaciones', async () => {
    const listeners: ((value: number) => void)[] = [];
    const subscribe: Subscribe<number> = (onNext) => {
      listeners.push(onNext);
      queueMicrotask(() => {
        onNext(1);
      });
      return vi.fn();
    };
    const { result } = renderHook(() => useLiveQuery(['n'], subscribe), { wrapper });
    await waitFor(() => {
      expect(result.current.data).toBe(1);
    });
    act(() => {
      listeners.forEach((listener) => {
        listener(2);
      });
    });
    await waitFor(() => {
      expect(result.current.data).toBe(2);
    });
  });

  it('expone el error de la primera carga', async () => {
    const subscribe: Subscribe<number> = (_onNext, onError) => {
      queueMicrotask(() => {
        onError(new AppError('permission_denied'));
      });
      return vi.fn();
    };
    const { result } = renderHook(() => useLiveQuery(['e'], subscribe), { wrapper });
    await waitFor(() => {
      expect(result.current.error?.code).toBe('permission_denied');
    });
  });

  it('no consulta si la suscripción es null', () => {
    const { result } = renderHook(() => useLiveQuery(['x'], null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
