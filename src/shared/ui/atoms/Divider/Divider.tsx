import { Separator } from 'radix-ui';
import { cn } from '@/shared/lib/cn';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  /** `true` si solo separa visualmente (no se anuncia). */
  decorative?: boolean;
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  decorative = true,
  className,
}: DividerProps) {
  return (
    <Separator.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}
