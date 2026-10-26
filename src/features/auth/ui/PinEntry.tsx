import { t } from '@/shared/lib/i18n';
import { Input, Numpad } from '@/shared/ui';
import { PIN_LENGTH } from '../domain/pin';

export interface PinEntryProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

/** Entrada de PIN: teclado físico (campo enmascarado) o numpad táctil. */
export function PinEntry({ value, onValueChange, onSubmit, disabled = false }: PinEntryProps) {
  const update = (next: string) => {
    onValueChange(next.replace(/\D/g, '').slice(0, PIN_LENGTH.max));
  };
  return (
    <div className="flex flex-col gap-4">
      <Input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        aria-label={t('lock.pinLabel')}
        maxLength={PIN_LENGTH.max}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          update(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit();
        }}
        className="text-center text-2xl tracking-[0.5em]"
      />
      <Numpad
        value={value}
        onValueChange={update}
        maxLength={PIN_LENGTH.max}
        label={t('lock.pinLabel')}
      />
    </div>
  );
}
