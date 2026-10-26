import { AlertDialog } from 'radix-ui';
import { t } from '@/shared/lib/i18n';
import { Button } from '../../atoms/Button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para acciones destructivas (anular venta, desactivar empleado). */
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
}

/** Diálogo modal de confirmación. El foco inicial va al botón de cancelar. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = t('ui.confirm'),
  cancelLabel = t('ui.cancel'),
  tone = 'primary',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-(--sp-z-overlay) bg-overlay" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-(--sp-z-modal) flex w-[calc(100%-2rem)] max-w-md -translate-1/2 flex-col gap-4 rounded-lg bg-surface p-6 shadow-lg">
          <AlertDialog.Title className="text-lg font-semibold text-text">{title}</AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className="text-sm text-text-muted">
              {description}
            </AlertDialog.Description>
          ) : null}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
