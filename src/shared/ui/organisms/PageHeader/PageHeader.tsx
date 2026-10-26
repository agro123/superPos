import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';

export interface PageHeaderProps {
  /** Título de la pantalla (h1). */
  title: string;
  description?: string;
  /** Acciones de la pantalla. Una sola debe ser primaria. */
  actions?: ReactNode;
  backTo?: { to: string; label: string };
  className?: string;
}

/** Encabezado de página con título, descripción y acciones. */
export function PageHeader({ title, description, actions, backTo, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="flex flex-col gap-1">
        {backTo ? (
          <Link
            to={backTo.to}
            className="inline-flex min-h-touch items-center gap-1 self-start text-sm text-text-muted hover:text-text"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {backTo.label}
          </Link>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-text">{title}</h1>
        {description ? <p className="text-sm text-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
