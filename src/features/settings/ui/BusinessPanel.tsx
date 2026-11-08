import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  businessUpdateSchema,
  businessWrites,
  TIME_ZONES,
  useActiveBusiness,
} from '@/features/business';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Select } from '@/shared/ui';

/** Formulario de business (Configuración y asistente de configuración inicial). */
export function BusinessPanel() {
  const { business } = useActiveBusiness();
  const toast = useToast();
  const form = useForm({
    resolver: zodResolver(businessUpdateSchema),
    values: { name: business.name, timezone: business.timezone },
  });
  const zones = TIME_ZONES.includes(business.timezone as (typeof TIME_ZONES)[number])
    ? TIME_ZONES
    : [business.timezone, ...TIME_ZONES];

  return (
    <div className="flex flex-col gap-4">
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => {
          businessWrites.updateBusiness(business.id, values);
          toast({ title: t('common.saved'), tone: 'success' });
        })}
      >
        <FormField label={t('onboarding.name')} error={form.formState.errors.name?.message}>
          {(control) => <Input {...control} {...form.register('name')} />}
        </FormField>
        <FormField label={t('onboarding.timezone')}>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('onboarding.currency')} hint={t('settings.readOnly')}>
            {(control) => (
              <Input {...control} value={t(`currency.${business.currency}`)} readOnly disabled />
            )}
          </FormField>
          <FormField label={t('onboarding.type')} hint={t('settings.readOnly')}>
            {(control) => (
              <Input {...control} value={t(`businessType.${business.type}`)} readOnly disabled />
            )}
          </FormField>
        </div>
        <Button type="submit" className="self-start" disabled={!form.formState.isDirty}>
          {t('common.save')}
        </Button>
      </form>
    </div>
  );
}
