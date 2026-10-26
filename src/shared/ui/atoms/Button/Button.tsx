import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  'inline-flex min-h-touch items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-(--sp-duration-fast) select-none disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg shadow-sm hover:bg-primary-hover',
        secondary: 'bg-primary-soft text-primary-soft-fg hover:bg-primary-soft/80',
        outline: 'border border-border-strong bg-surface text-text hover:bg-surface-muted',
        ghost: 'text-text hover:bg-surface-muted',
        danger: 'bg-danger text-danger-fg shadow-sm hover:bg-danger-hover',
      },
      size: {
        sm: 'px-3 text-sm',
        md: 'px-4 text-base',
        lg: 'min-h-14 px-6 text-lg',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Muestra un indicador de carga, marca `aria-busy` y deshabilita el botón. */
  loading?: boolean;
  /** Ícono antes del texto. */
  leftIcon?: ReactNode;
  /** Ícono después del texto. */
  rightIcon?: ReactNode;
  /** Renderiza el hijo (p. ej. un `<Link>`) con los estilos del botón. */
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/** Botón base. Una sola acción `primary` por pantalla (docs/design-system/principles.md). */
export function Button({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  leftIcon,
  rightIcon,
  asChild = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, fullWidth }), className);
  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
