import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { IconButton } from '../../atoms/IconButton';

export interface QuantityStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  /** Nombre del ítem, para etiquetas accesibles ("Aumentar Café"). */
  itemName: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/** Botones − / + con el valor actual. Pensado para el carrito (objetivos táctiles de 44 px). */
export function QuantityStepper({
  value,
  onValueChange,
  itemName,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  className,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={`${t('ui.quantity')}: ${itemName}`}
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-surface',
        className,
      )}
    >
      <IconButton
        label={t('ui.decrease', { name: itemName })}
        icon={<Minus />}
        disabled={value - step < min}
        onClick={() => {
          onValueChange(value - step);
        }}
      />
      <output
        aria-live="polite"
        className="min-w-8 text-center text-base font-semibold tabular-nums"
      >
        {value}
      </output>
      <IconButton
        label={t('ui.increase', { name: itemName })}
        icon={<Plus />}
        disabled={value + step > max}
        onClick={() => {
          onValueChange(value + step);
        }}
      />
    </div>
  );
}
