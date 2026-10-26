import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { IconButton } from '../../atoms/IconButton';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Botones de acción al pie. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

/** Diálogo modal centrado. Atrapa el foco y se cierra con Escape. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--sp-z-overlay) bg-overlay" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed top-1/2 left-1/2 z-(--sp-z-modal) flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-1/2 flex-col rounded-lg bg-surface shadow-lg',
            sizes[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-text-muted">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <IconButton label={t('ui.close')} icon={<X />} className="-m-2" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
