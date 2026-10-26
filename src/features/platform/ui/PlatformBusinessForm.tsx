import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { BUSINESS_PLANS, BUSINESS_TYPES, TIME_ZONES } from '@/features/business';
import { CURRENCY_CODES } from '@/shared/domain/money';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { FormField, Input, Select, Text } from '@/shared/ui';
import {
  platformBusinessInputSchema,
  type PlatformBusinessInput,
} from '../domain/platformBusiness';

type FormInput = PlatformBusinessInput;

interface SelectControllerProps {
  control: Control<FormInput>;
  name: FieldPath<FormInput>;
  label: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
}

function SelectController({ control, name, label, hint, options }: SelectControllerProps) {
  return (
    <FormField label={label} hint={hint}>
      {(fieldControl) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Select
              {...fieldControl}
              value={field.value}
              onValueChange={field.onChange}
              options={options}
            />
          )}
        />
      )}
    </FormField>
  );
}

export interface PlatformBusinessFormProps {
  onSubmit: (input: PlatformBusinessInput) => void;
  error: unknown;
  offline: boolean;
}

/** Alta de un negocio por el super admin. El botón de envío vive en el pie del Drawer. */
export function PlatformBusinessForm({ onSubmit, error, offline }: PlatformBusinessFormProps) {
  const form = useForm({
    resolver: zodResolver(platformBusinessInputSchema),
    defaultValues: {
      name: '',
      type: 'store' as const,
      currency: 'COP' as const,
      timezone: 'America/Bogota',
      plan: 'free' as const,
      ownerEmail: '',
    },
  });
  const { errors } = form.formState;

  return (
    <form
      id="platform-business-form"
      noValidate
      className="flex flex-col gap-4 p-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormField label={t('onboarding.name')} error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="off" {...form.register('name')} />}
      </FormField>
      <FormField
        label={t('platform.form.ownerEmail')}
        hint={t('platform.form.ownerEmailHint')}
        error={errors.ownerEmail?.message}
      >
        {(control) => (
          <Input {...control} type="email" autoComplete="off" {...form.register('ownerEmail')} />
        )}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectController
          control={form.control}
          name="type"
          label={t('onboarding.type')}
          options={BUSINESS_TYPES.map((value) => ({ value, label: t(`businessType.${value}`) }))}
        />
        <SelectController
          control={form.control}
          name="plan"
          label={t('platform.plan')}
          hint={t('plan.pendingHint')}
          options={BUSINESS_PLANS.map((value) => ({ value, label: t(`plan.${value}`) }))}
        />
        <SelectController
          control={form.control}
          name="currency"
          label={t('onboarding.currency')}
          hint={t('onboarding.currencyHint')}
          options={CURRENCY_CODES.map((value) => ({ value, label: t(`currency.${value}`) }))}
        />
        <SelectController
          control={form.control}
          name="timezone"
          label={t('onboarding.timezone')}
          options={TIME_ZONES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
        />
      </div>
      {offline ? <Text variant="danger">{t('platform.form.offline')}</Text> : null}
      {error ? (
        <Text variant="danger" role="alert">
          {errorMessage(error)}
        </Text>
      ) : null}
    </form>
  );
}
