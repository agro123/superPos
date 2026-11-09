import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuthListener } from '@/features/auth';
import { registerCatalogOutboxHandlers } from '@/features/catalog';
import { registerRestaurantSaleHandler } from '@/features/restaurant';
import { useToastStore } from '@/shared/hooks/useToast';
import { useSyncStore } from '@/shared/infrastructure/offline/syncStore';
import { getOutbox, startSyncMonitor } from '@/shared/infrastructure/offline/runtime';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Toaster } from '@/shared/ui';
import { useApplyTheme } from './theme';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // offlineFirst: las consultas corren aunque no haya red (Firestore responde desde la caché).
      queries: { networkMode: 'offlineFirst', retry: 1, refetchOnWindowFocus: false },
      mutations: { networkMode: 'offlineFirst' },
    },
  });
}

/** Efectos globales: sesión, sincronización, outbox, tema y avisos de errores en segundo plano. */
function GlobalEffects() {
  useAuthListener();
  useApplyTheme();
  const show = useToastStore((state) => state.show);
  const lastError = useSyncStore((state) => state.lastError);
  const clearError = useSyncStore((state) => state.clearError);

  useEffect(() => {
    registerCatalogOutboxHandlers(getOutbox());
    const stopRestaurant = registerRestaurantSaleHandler();
    const stopSync = startSyncMonitor();
    return () => {
      stopRestaurant();
      stopSync();
    };
  }, []);

  useEffect(() => {
    if (!lastError) return;
    show({ title: t('app.syncErrorTitle'), description: errorMessage(lastError), tone: 'danger' });
    clearError();
  }, [lastError, show, clearError]);

  return null;
}

function Toasts() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  return <Toaster toasts={toasts} onDismiss={dismiss} />;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalEffects />
      {children}
      <Toasts />
    </QueryClientProvider>
  );
}
