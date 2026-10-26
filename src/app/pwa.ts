import { registerSW } from 'virtual:pwa-register';
import { create } from 'zustand';
import { useToastStore } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';

interface PwaState {
  /** Hay una versión nueva esperando (registerType: 'prompt'). */
  needRefresh: boolean;
  update: () => void;
}

export const usePwaStore = create<PwaState>()(() => ({
  needRefresh: false,
  update: () => undefined,
}));

/**
 * Registra el Service Worker al arrancar (también en /login), para que la app abra sin red
 * desde la primera visita. La actualización la decide el usuario (UpdatePrompt).
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  const updateServiceWorker = registerSW({
    onNeedRefresh: () => {
      usePwaStore.setState({ needRefresh: true });
    },
    onOfflineReady: () => {
      useToastStore.getState().show({ title: t('app.offlineReady'), tone: 'success' });
    },
  });
  usePwaStore.setState({ update: () => void updateServiceWorker(true) });
}
