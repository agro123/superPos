import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Badge, type BadgeTone } from '../../atoms/Badge';
import { Skeleton } from '../../atoms/Skeleton';

export interface StatCardProps {
  label: string;
  value: string;
  /** Comparación o contexto ("+12 % vs. ayer"). */
  trend?: { label: string; tone: BadgeTone };
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}

/** Tarjeta de métrica para el dashboard y los reportes. */
export function StatCard({
  label,
  value,
  trend,
  hint,
  icon,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
        <span>{label}</span>
        {icon ? (
          <span aria-hidden className="text-text-subtle [&_svg]:size-5">
            {icon}
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-2/3" />
      ) : (
        <p className="text-xl font-semibold tracking-tight text-text tabular-nums">{value}</p>
      )}
      {trend && !loading ? (
        <Badge tone={trend.tone} className="self-start">
          {trend.label}
        </Badge>
      ) : null}
      {hint ? <p className="text-xs text-text-subtle">{hint}</p> : null}
    </section>
  );
}
