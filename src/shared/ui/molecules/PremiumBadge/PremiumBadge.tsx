import { Crown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Badge } from '../../atoms/Badge';

export interface PremiumBadgeProps {
  /** Texto visible (p. ej. "Premium"). */
  label: string;
  className?: string;
}

/** Marca una función del plan premium (ícono + texto: nunca solo color). */
export function PremiumBadge({ label, className }: PremiumBadgeProps) {
  return (
    <Badge tone="warning" className={cn('inline-flex items-center gap-1', className)}>
      <Crown aria-hidden className="size-3" />
      {label}
    </Badge>
  );
}
