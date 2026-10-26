import type { InputHTMLAttributes, Ref } from 'react';
import { money, type CurrencyCode, type Money } from '@/shared/domain/money';
import { useControlledText } from '@/shared/hooks/useControlledText';
import { cn } from '@/shared/lib/cn';
import { moneyToInputText, parseMoneyInput } from '@/shared/lib/formatters';
import { inputClasses } from '../../tokens/recipes';

export interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type'
> {
  /** Monto en unidad mínima (centavos) o `null` si está vacío o es inválido. */
  value: Money | number | null;
  onValueChange: (value: Money | null) => void;
  currency: CurrencyCode;
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Entrada de dinero en unidades mayores ("12.500") que emite `Money` en centavos. */
export function MoneyInput({
  value,
  onValueChange,
  currency,
  invalid = false,
  className,
  ...props
}: MoneyInputProps) {
  const parse = (text: string) => parseMoneyInput(text, currency);
  const [text, setText] = useControlledText<number>(
    value,
    (v) => moneyToInputText(money(v), currency),
    parse,
  );
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-subtle"
      >
        $
      </span>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        aria-invalid={invalid || undefined}
        className={cn(inputClasses, 'pl-7 text-right tabular-nums', className)}
        onChange={(event) => {
          setText(event.target.value);
          onValueChange(parse(event.target.value));
        }}
      />
    </div>
  );
}
