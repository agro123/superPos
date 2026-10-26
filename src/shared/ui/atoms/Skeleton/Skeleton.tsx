import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

/** Marcador de forma para contenido en carga. Es decorativo (`aria-hidden`). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      data-testid="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}
