import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { CurrencyCode } from '@/shared/domain/money';
import { t } from '@/shared/lib/i18n';
import { FormField, Input, MoneyInput } from '@/shared/ui';
import { closeShiftInputSchema, openShiftInputSchema } from '../domain/cashShift';

/** Formulario de apertura (solo UI en esta fase: valida y avisa). */
export function OpenShiftForm({
  currency,
  onSubmit,
}: {
  currency: CurrencyCode;
  onSubmit: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(openShiftInputSchema),
    defaultValues: { openingFloatMinor: Number.NaN },
  });
  return (
    <form id="open-shift-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        label={t('cash.openingFloat')}
        error={form.formState.errors.openingFloatMinor ? t('errors.invalid_money') : undefined}
      >
        {(control) => (
          <Controller
            control={form.control}
            name="openingFloatMinor"
            render={({ field }) => (
              <MoneyInput
                {...control}
                currency={currency}
                value={Number.isNaN(field.value) ? null : field.value}
                onValueChange={(v) => {
                  field.onChange(v ?? Number.NaN);
                }}
              />
            )}
          />
        )}
      </FormField>
    </form>
  );
}

/** Formulario de cierre/arqueo (solo UI en esta fase). */
export function CloseShiftForm({
  currency,
  onSubmit,
}: {
  currency: CurrencyCode;
  onSubmit: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(closeShiftInputSchema),
    defaultValues: { countedCashMinor: Number.NaN, notes: '' },
  });
  return (
    <form
      id="close-shift-form"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormField
        label={t('cash.counted')}
        error={form.formState.errors.countedCashMinor ? t('errors.invalid_money') : undefined}
      >
        {(control) => (
          <Controller
            control={form.control}
            name="countedCashMinor"
            render={({ field }) => (
              <MoneyInput
                {...control}
                currency={currency}
                value={Number.isNaN(field.value) ? null : field.value}
                onValueChange={(v) => {
                  field.onChange(v ?? Number.NaN);
                }}
              />
            )}
          />
        )}
      </FormField>
      <FormField label={t('common.notes')} optional>
        {(control) => <Input {...control} {...form.register('notes')} />}
      </FormField>
    </form>
  );
}
