import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { IconButton } from '../../atoms/IconButton';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** `right` para detalle en escritorio; `bottom` para hojas en móvil; `left` para navegación. */
  side?: 'left' | 'right' | 'bottom';
  /** Oculta el encabezado visualmente (el título sigue siendo el nombre accesible). */
  hideHeader?: boolean;
}

const sides = {
  left: 'inset-y-0 left-0 h-full w-[min(20rem,85vw)]',
  right: 'inset-y-0 right-0 h-full w-full max-w-md',
  bottom: 'inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-lg',
} as const;

/** Panel lateral o inferior. Atrapa el foco y se cierra con Escape. */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  hideHeader = false,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--sp-z-overlay) bg-overlay" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn('fixed z-(--sp-z-modal) flex flex-col bg-surface shadow-lg', sides[side])}
        >
          <div
            className={cn(
              'flex items-start justify-between gap-4 border-b border-border p-4',
              hideHeader && 'sr-only',
            )}
          >
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
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer ? (
            <div className="flex flex-col gap-2 border-t border-border p-4">{footer}</div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
