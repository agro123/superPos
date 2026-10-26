import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import type { z } from 'zod';
import { money, subtractMoney, type CurrencyCode, type Money } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { FormField, Input, MoneyInput, Text } from '@/shared/ui';
import {
  closeShiftInputSchema,
  expenseInputSchema,
  openShiftInputSchema,
} from '../domain/cashShift';

/** Campo de dinero controlado (NaN = vacío, para que Zod lo marque inválido). */
function MoneyField<T extends Record<string, unknown>>({
  control,
  name,
  label,
  currency,
  error,
}: {
  control: Control<T>;
  name: Parameters<typeof Controller<T>>[0]['name'];
  label: string;
  currency: CurrencyCode;
  error: boolean;
}) {
  return (
    <FormField label={label} error={error ? t('errors.invalid_money') : undefined}>
      {(field) => (
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange } }) => (
            <MoneyInput
              {...field}
              currency={currency}
              value={typeof value === 'number' && !Number.isNaN(value) ? value : null}
              onValueChange={(v) => {
                onChange(v ?? Number.NaN);
              }}
            />
          )}
        />
      )}
    </FormField>
  );
}

/** Apertura: base de efectivo con la que empieza el turno. */
export function OpenShiftForm({
  currency,
  onSubmit,
}: {
  currency: CurrencyCode;
  onSubmit: (values: z.output<typeof openShiftInputSchema>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(openShiftInputSchema),
    defaultValues: { openingFloatMinor: Number.NaN },
  });
  return (
    <form id="open-shift-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <MoneyField
        control={form.control}
        name="openingFloatMinor"
        label={t('cash.openingFloat')}
        currency={currency}
        error={Boolean(form.formState.errors.openingFloatMinor)}
      />
    </form>
  );
}

/** Cierre/arqueo: efectivo contado frente al esperado, con la diferencia en vivo. */
export function CloseShiftForm({
  currency,
  expected,
  onSubmit,
}: {
  currency: CurrencyCode;
  expected: Money;
  onSubmit: (values: z.output<typeof closeShiftInputSchema>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(closeShiftInputSchema),
    defaultValues: { countedCashMinor: Number.NaN, notes: '' },
  });
  const counted = useWatch({ control: form.control, name: 'countedCashMinor' });
  const hasCount = typeof counted === 'number' && !Number.isNaN(counted);
  const difference = hasCount ? subtractMoney(money(counted), expected) : null;
  return (
    <form
      id="close-shift-form"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <MoneyField
        control={form.control}
        name="countedCashMinor"
        label={t('cash.counted')}
        currency={currency}
        error={Boolean(form.formState.errors.countedCashMinor)}
      />
      {difference === null ? null : (
        <Text variant="strong" role="status">
          {t(difference < 0 ? 'cash.shortage' : difference > 0 ? 'cash.surplus' : 'cash.balanced', {
            amount: formatMoney(money(Math.abs(difference)), currency),
          })}
        </Text>
      )}
      <FormField label={t('common.notes')} optional>
        {(control) => <Input {...control} {...form.register('notes')} />}
      </FormField>
    </form>
  );
}

/** Gasto (salida de efectivo) durante el turno. */
export function ExpenseForm({
  currency,
  onSubmit,
}: {
  currency: CurrencyCode;
  onSubmit: (values: z.output<typeof expenseInputSchema>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(expenseInputSchema),
    defaultValues: { amountMinor: Number.NaN, description: '' },
  });
  return (
    <form
      id="expense-form"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <MoneyField
        control={form.control}
        name="amountMinor"
        label={t('cash.expenseAmount')}
        currency={currency}
        error={Boolean(form.formState.errors.amountMinor)}
      />
      <FormField
        label={t('cash.expenseDescription')}
        error={form.formState.errors.description ? t('errors.validation') : undefined}
      >
        {(control) => <Input {...control} {...form.register('description')} />}
      </FormField>
    </form>
  );
}
