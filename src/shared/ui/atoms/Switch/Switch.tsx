import { Switch as RadixSwitch } from 'radix-ui';
import { cn } from '@/shared/lib/cn';

export interface SwitchProps {
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

/** Interruptor encendido/apagado para ajustes que se aplican de inmediato. */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <RadixSwitch.Root
      {...props}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-border-strong transition-colors duration-(--sp-duration-fast)',
        'after:absolute after:-inset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary',
        className,
      )}
    >
      <RadixSwitch.Thumb className="block size-5 translate-x-1 rounded-full bg-white shadow-sm transition-transform duration-(--sp-duration-fast) data-[state=checked]:translate-x-6" />
    </RadixSwitch.Root>
  );
}
