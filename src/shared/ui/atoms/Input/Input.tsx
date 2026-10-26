import type { InputHTMLAttributes, Ref } from 'react';
import { cn } from '@/shared/lib/cn';
import { inputClasses } from '../../tokens/recipes';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marca el campo como inválido (`aria-invalid`) y lo resalta. */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Campo de texto base. Usar dentro de `FormField` para obtener label y error. */
export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid ? true : props['aria-invalid']}
      className={cn(inputClasses, className)}
    />
  );
}
