import { Dialog, RadioGroup } from 'radix-ui';
import type { ReactNode } from 'react';
import type { PaymentMethod } from '@/shared/domain/payment';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { Button } from '../../atoms/Button';

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}

export interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLabel: string;
  methods: readonly PaymentMethodOption[];
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  /** Monto recibido ya formateado. */
  tenderedLabel: string;
  /** Vuelto o saldo pendiente, ya formateados. */
  summary: { label: string; value: string; tone: 'success' | 'warning' };
  /** Teclado para el monto recibido (p. ej. `<Numpad />`), compuesto por la página. */
  keypad: ReactNode;
  /** Aviso contextual (p. ej. "sin conexión: solo efectivo"). */
  notice?: ReactNode;
  confirmLabel: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
}

/** Hoja de cobro: método, monto recibido y vuelto. Solo presentación; la lógica vive en `features/sales`. */
export function PaymentSheet(props: PaymentSheetProps) {
  const {
    open,
    onOpenChange,
    totalLabel,
    methods,
    method,
    onMethodChange,
    tenderedLabel,
    summary,
    keypad,
    notice,
  } = props;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--sp-z-overlay) bg-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-(--sp-z-modal) flex max-h-[95dvh] flex-col gap-4 overflow-y-auto rounded-t-lg bg-surface p-4 shadow-lg md:inset-x-auto md:top-0 md:right-0 md:h-full md:max-h-none md:w-[28rem] md:rounded-none"
        >
          <div className="flex items-baseline justify-between gap-2">
            <Dialog.Title className="text-lg font-semibold text-text">
              {t('ui.payment.title')}
            </Dialog.Title>
            <p className="text-sm text-text-muted">
              {t('ui.payment.total')}:{' '}
              <span className="text-xl font-bold text-text tabular-nums">{totalLabel}</span>
            </p>
          </div>
          <RadioGroup.Root
            aria-label={t('ui.payment.method')}
            value={method}
            onValueChange={(value) => {
              const selected = methods.find((option) => option.value === value);
              if (selected) onMethodChange(selected.value);
            }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {methods.map((option) => (
              <RadioGroup.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border border-border bg-surface text-sm font-medium text-text disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:text-primary-soft-fg [&_svg]:size-5"
              >
                <span aria-hidden>{option.icon}</span>
                {option.label}
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
          {notice}
          <div className="flex items-center justify-between rounded-md bg-surface-muted p-3">
            <span className="text-sm text-text-muted">{t('ui.payment.tendered')}</span>
            <output aria-live="polite" className="text-2xl font-bold text-text tabular-nums">
              {tenderedLabel}
            </output>
          </div>
          {keypad}
          <div
            className={cn(
              'flex items-center justify-between rounded-md p-3',
              summary.tone === 'success'
                ? 'bg-success-soft text-success-soft-fg'
                : 'bg-warning-soft text-warning-soft-fg',
            )}
          >
            <span className="text-sm font-medium">{summary.label}</span>
            <span className="text-lg font-semibold tabular-nums">{summary.value}</span>
          </div>
          <Button size="lg" fullWidth disabled={props.confirmDisabled} onClick={props.onConfirm}>
            {props.confirmLabel}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
