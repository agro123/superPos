import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { BUSINESS_PLANS, TIME_ZONES, type Business } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { FormField, Input, Select } from '@/shared/ui';
import {
  platformBusinessUpdateSchema,
  type PlatformBusinessUpdate,
} from '../domain/platformBusiness';

export interface PlatformBusinessEditFormProps {
  business: Business;
  onSubmit: (update: PlatformBusinessUpdate) => void;
}

/** Edición por el super admin: nombre, zona horaria y plan. Tipo y moneda son inmutables. */
export function PlatformBusinessEditForm({ business, onSubmit }: PlatformBusinessEditFormProps) {
  const form = useForm({
    resolver: zodResolver(platformBusinessUpdateSchema),
    defaultValues: { name: business.name, timezone: business.timezone, plan: business.plan },
  });
  const { errors } = form.formState;
  // La zona actual puede no estar en la lista sugerida (negocios antiguos).
  const zones = TIME_ZONES.some((zone) => zone === business.timezone)
    ? TIME_ZONES
    : [business.timezone, ...TIME_ZONES];

  return (
    <form
      id="platform-business-edit-form"
      noValidate
      className="flex flex-col gap-4 p-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormField label={t('onboarding.name')} error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="off" {...form.register('name')} />}
      </FormField>
      <FormField label={t('platform.plan')} hint={t('plan.pendingHint')}>
        {(control) => (
          <Controller
            control={form.control}
            name="plan"
            render={({ field }) => (
              <Select
                {...control}
                value={field.value}
                onValueChange={field.onChange}
                options={BUSINESS_PLANS.map((value) => ({ value, label: t(`plan.${value}`) }))}
              />
            )}
          />
        )}
      </FormField>
      <FormField label={t('onboarding.timezone')} error={errors.timezone?.message}>
        {(control) => (
          <Controller
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <Select
                {...control}
                value={field.value}
                onValueChange={field.onChange}
                options={zones.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
              />
            )}
          />
        )}
      </FormField>
    </form>
  );
}
