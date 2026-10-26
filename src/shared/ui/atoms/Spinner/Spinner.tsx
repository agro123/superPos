import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';

export interface SpinnerProps {
  /** Texto para lectores de pantalla. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-10' } as const;

/** Indicador de carga indeterminada. Preferir `Skeleton` cuando se conoce la forma del contenido. */
export function Spinner({ label = t('ui.loading'), size = 'md', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex items-center text-primary', className)}>
      <Loader2 aria-hidden className={cn('animate-spin motion-reduce:animate-none', sizes[size])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
