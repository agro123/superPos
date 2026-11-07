import { t } from '@/shared/lib/i18n';
import { FormField, Input, NumberInput } from '@/shared/ui';
import { IDLE_LOCK_MINUTES, type TerminalUpdate } from '../domain/terminal';

export interface TerminalFieldsProps {
  value: TerminalUpdate;
  onChange: (value: TerminalUpdate) => void;
  nameError: boolean;
}

/** Nombre del terminal y minutos de inactividad (usado al autorizar y al editar). */
export function TerminalFields({ value, onChange, nameError }: TerminalFieldsProps) {
  return (
    <>
      <FormField label={t('terminals.name')} error={nameError ? t('errors.validation') : undefined}>
        {(control) => (
          <Input
            {...control}
            maxLength={40}
            placeholder={t('terminals.namePlaceholder')}
            value={value.name}
            onChange={(event) => {
              onChange({ ...value, name: event.target.value });
            }}
          />
        )}
      </FormField>
      <FormField label={t('terminals.idle')}>
        {(control) => (
          <NumberInput
            {...control}
            min={IDLE_LOCK_MINUTES.min}
            max={IDLE_LOCK_MINUTES.max}
            value={value.idleLockMinutes}
            onValueChange={(minutes) => {
              onChange({ ...value, idleLockMinutes: minutes ?? IDLE_LOCK_MINUTES.default });
            }}
          />
        )}
      </FormField>
    </>
  );
}
