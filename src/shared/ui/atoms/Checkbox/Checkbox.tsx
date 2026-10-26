import { Check } from 'lucide-react';
import { Checkbox as RadixCheckbox } from 'radix-ui';
import { cn } from '@/shared/lib/cn';

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
}

/** Casilla de verificación. Su área táctil es de 44 px aunque el cuadro visible sea menor. */
export function Checkbox({ onCheckedChange, className, ...props }: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      {...props}
      onCheckedChange={(state) => onCheckedChange?.(state === true)}
      className={cn(
        'relative inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface',
        'after:absolute after:-inset-3 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <RadixCheckbox.Indicator>
        <Check aria-hidden className="size-4" strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
