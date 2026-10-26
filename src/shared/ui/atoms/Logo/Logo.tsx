import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';

export interface LogoProps {
  /** Muestra solo el ícono (sin el nombre). */
  compact?: boolean;
  className?: string;
}

/** Marca de la aplicación. */
export function Logo({ compact = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold text-text', className)}>
      <svg aria-hidden viewBox="0 0 512 512" className="size-8 shrink-0">
        <rect width="512" height="512" rx="112" className="fill-primary" />
        <path
          d="M152 176h208a24 24 0 0 1 24 24v152a24 24 0 0 1-24 24H152a24 24 0 0 1-24-24V200a24 24 0 0 1 24-24ZM192 136h128M184 256h56M184 312h96"
          fill="none"
          className="stroke-primary-fg"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {compact ? (
        <span className="sr-only">{t('app.name')}</span>
      ) : (
        <span className="text-lg tracking-tight">{t('app.name')}</span>
      )}
    </span>
  );
}
