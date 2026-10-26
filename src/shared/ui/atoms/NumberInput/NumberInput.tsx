import type { InputHTMLAttributes, Ref } from 'react';
import { useControlledText } from '@/shared/hooks/useControlledText';
import { cn } from '@/shared/lib/cn';
import { inputClasses } from '../../tokens/recipes';

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max'
> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Permite decimales (coma o punto). Por defecto solo enteros. */
  allowDecimal?: boolean;
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

function parseNumber(text: string, allowDecimal: boolean): number | null {
  const normalized = text.trim().replace(',', '.');
  const pattern = allowDecimal ? /^-?\d+(\.\d*)?$/ : /^-?\d+$/;
  return pattern.test(normalized) ? Number(normalized) : null;
}

/** Entrada numérica con teclado numérico en móvil y límites `min`/`max` aplicados al salir. */
export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  allowDecimal = false,
  invalid = false,
  className,
  onBlur,
  ...props
}: NumberInputProps) {
  const parse = (text: string) => parseNumber(text, allowDecimal);
  const [text, setText] = useControlledText(value, (v) => String(v).replace('.', ','), parse);
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  return (
    <input
      {...props}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={text}
      aria-invalid={invalid || undefined}
      className={cn(inputClasses, 'tabular-nums', className)}
      onChange={(event) => {
        setText(event.target.value);
        onValueChange(parse(event.target.value));
      }}
      onBlur={(event) => {
        const parsed = parse(text);
        if (parsed !== null && clamp(parsed) !== parsed) onValueChange(clamp(parsed));
        onBlur?.(event);
      }}
    />
  );
}
