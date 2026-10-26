import { Delete } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { applyNumpadKey, type NumpadKey } from './numpadModel';

export interface NumpadProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Muestra la tecla de coma decimal en lugar de "00". */
  allowDecimal?: boolean;
  maxLength?: number;
  label?: string;
  className?: string;
}

const DIGITS: NumpadKey[] = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

/** Teclado numérico táctil para montos y cantidades. */
export function Numpad({
  value,
  onValueChange,
  allowDecimal = false,
  maxLength = 12,
  label = t('ui.numpad.label'),
  className,
}: NumpadProps) {
  const press = (key: NumpadKey) => {
    onValueChange(applyNumpadKey(value, key, { allowDecimal, maxLength }));
  };
  const keyClass =
    'flex min-h-14 items-center justify-center rounded-md border border-border bg-surface text-xl font-semibold text-text tabular-nums hover:bg-surface-muted active:bg-border';
  return (
    <div role="group" aria-label={label} className={cn('grid grid-cols-3 gap-2', className)}>
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className={keyClass}
          onClick={() => {
            press(digit);
          }}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className={keyClass}
        onClick={() => {
          press(allowDecimal ? ',' : '00');
        }}
      >
        {allowDecimal ? ',' : '00'}
      </button>
      <button
        type="button"
        className={keyClass}
        onClick={() => {
          press('0');
        }}
      >
        0
      </button>
      <button
        type="button"
        aria-label={t('ui.numpad.backspace')}
        className={keyClass}
        onClick={() => {
          press('backspace');
        }}
      >
        <Delete aria-hidden className="size-6" />
      </button>
    </div>
  );
}
