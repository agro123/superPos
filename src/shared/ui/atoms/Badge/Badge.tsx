import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-muted text-text-muted',
        primary: 'bg-primary-soft text-primary-soft-fg',
        success: 'bg-success-soft text-success-soft-fg',
        warning: 'bg-warning-soft text-warning-soft-fg',
        danger: 'bg-danger-soft text-danger-soft-fg',
        info: 'bg-info-soft text-info-soft-fg',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Ícono decorativo antes del texto. El significado nunca depende solo del color. */
  icon?: ReactNode;
}

/** Etiqueta corta de estado (stock bajo, pendiente de sincronizar, rol…). */
export function Badge({ tone, icon, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {icon}
      {children}
    </span>
  );
}
