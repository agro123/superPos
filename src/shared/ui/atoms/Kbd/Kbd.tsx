import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

/** Tecla o atajo de teclado ("F2", "Ctrl K"). */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-border-strong bg-surface-muted px-1.5 font-sans text-xs font-medium text-text-muted',
        className,
      )}
      {...props}
    />
  );
}
