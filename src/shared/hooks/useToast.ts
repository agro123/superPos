import { create } from 'zustand';
import type { ToastMessage } from '@/shared/ui';

interface ToastState {
  toasts: ToastMessage[];
  show: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

/** Cola de notificaciones (estado de UI). `app/` la renderiza con `<Toaster />`. */
export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  show: (toast) => {
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id: crypto.randomUUID() }],
    }));
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));

/** Muestra notificaciones desde cualquier pantalla. */
export function useToast(): ToastState['show'] {
  return useToastStore((state) => state.show);
}
