import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Llamada a la acción (crear el primer producto, reintentar…). */
  action?: ReactNode;
  /** `danger` para estados de error. */
  tone?: 'neutral' | 'danger';
  className?: string;
}

/** Estado vacío o de error con llamada a la acción. */
export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = 'neutral',
  className,
}: EmptyStateProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden
          className={cn(
            'flex size-14 items-center justify-center rounded-full [&_svg]:size-7',
            tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-surface-muted text-text-subtle',
          )}
        >
          {icon}
        </div>
      ) : null}
      <p className="text-lg font-semibold text-text">{title}</p>
      {description ? <p className="max-w-sm text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
