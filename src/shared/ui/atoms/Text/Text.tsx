import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

const textVariants = cva('', {
  variants: {
    variant: {
      body: 'text-base text-text',
      muted: 'text-sm text-text-muted',
      small: 'text-sm text-text',
      caption: 'text-xs text-text-subtle',
      strong: 'text-base font-semibold text-text',
      danger: 'text-sm text-danger',
    },
  },
  defaultVariants: { variant: 'body' },
});

export interface TextProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div' | 'small';
}

/** Texto con la escala tipográfica del sistema. */
export function Text({ as: Component = 'p', variant, className, ...props }: TextProps) {
  return <Component className={cn(textVariants({ variant }), className)} {...props} />;
}
