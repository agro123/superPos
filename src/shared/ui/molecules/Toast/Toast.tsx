import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { Toast as RadixToast } from 'radix-ui';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}

export interface ToastProps extends ToastMessage {
  onDismiss: (id: string) => void;
}

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const;
const iconColors = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

/** Notificación breve. Los errores usan `type="foreground"` para anunciarse de inmediato. */
export function Toast({ id, title, description, tone = 'info', onDismiss }: ToastProps) {
  const Icon = icons[tone];
  return (
    <RadixToast.Root
      type={tone === 'danger' ? 'foreground' : 'background'}
      duration={tone === 'danger' ? 8000 : 4000}
      onOpenChange={(open) => {
        if (!open) onDismiss(id);
      }}
      className="data-[swipe=end]:animate-out flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-lg"
    >
      <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', iconColors[tone])} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <RadixToast.Title className="text-sm font-semibold text-text">{title}</RadixToast.Title>
        {description ? (
          <RadixToast.Description className="text-sm text-text-muted">
            {description}
          </RadixToast.Description>
        ) : null}
      </div>
      <RadixToast.Close
        aria-label={t('ui.close')}
        className="-m-2 inline-flex size-touch items-center justify-center rounded-md text-text-subtle hover:bg-surface-muted"
      >
        <X aria-hidden className="size-4" />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
