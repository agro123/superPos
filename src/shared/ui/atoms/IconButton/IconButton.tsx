import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/shared/lib/cn';

const iconButtonVariants = cva(
  'inline-flex size-touch shrink-0 items-center justify-center rounded-md transition-colors duration-(--sp-duration-fast) disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5',
  {
    variants: {
      variant: {
        ghost: 'text-text-muted hover:bg-surface-muted hover:text-text',
        outline: 'border border-border-strong bg-surface text-text hover:bg-surface-muted',
        primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
        danger: 'text-danger hover:bg-danger-soft',
      },
    },
    defaultVariants: { variant: 'ghost' },
  },
);

export interface IconButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'>,
    VariantProps<typeof iconButtonVariants> {
  /** Nombre accesible obligatorio: el botón no tiene texto visible. */
  label: string;
  icon: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

/** Botón cuadrado de 44×44 px con solo un ícono. */
export function IconButton({
  label,
  icon,
  variant,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant }), className)}
      {...props}
    >
      {icon}
    </button>
  );
}
