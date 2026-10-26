import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Nivel semántico (h1–h4). Mantener la jerarquía: un solo h1 por pantalla. */
  level?: 1 | 2 | 3 | 4;
  /** Tamaño visual, independiente del nivel semántico. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'text-base font-semibold',
  md: 'text-lg font-semibold',
  lg: 'text-xl font-semibold tracking-tight',
  xl: 'text-2xl font-bold tracking-tight',
} as const;

const defaultSize = { 1: 'lg', 2: 'md', 3: 'sm', 4: 'sm' } as const;

export function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const Component = `h${level}` as const;
  return (
    <Component
      className={cn('text-text', sizes[size ?? defaultSize[level]], className)}
      {...props}
    />
  );
}
