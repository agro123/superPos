import { Toast as RadixToast } from 'radix-ui';
import { t } from '@/shared/lib/i18n';
import { Toast, type ToastMessage } from './Toast';

export interface ToasterProps {
  toasts: readonly ToastMessage[];
  onDismiss: (id: string) => void;
}

/** Región de notificaciones. La cola de mensajes vive fuera (estado de UI en `app/`). */
export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <RadixToast.Provider swipeDirection="right" label={t('ui.notifications')}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
      <RadixToast.Viewport className="fixed right-0 bottom-0 z-(--sp-z-toast) flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </RadixToast.Provider>
  );
}
