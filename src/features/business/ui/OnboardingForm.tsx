import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { CURRENCY_CODES } from '@/shared/domain/money';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Select, Switch, Text } from '@/shared/ui';
import { BUSINESS_TYPES, onboardingInputSchema, type OnboardingInput } from '../domain/business';
import { DEFAULT_TAX_OPTIONS, TIME_ZONES } from '../domain/options';

export interface OnboardingFormProps {
  onSubmit: (input: OnboardingInput) => void;
  submitting: boolean;
  error: unknown;
  disabled: boolean;
}

export function OnboardingForm({ onSubmit, submitting, error, disabled }: OnboardingFormProps) {
  const form = useForm({
    resolver: zodResolver(onboardingInputSchema),
    defaultValues: {
      name: '',
      type: 'store' as const,
      currency: 'COP' as const,
      timezone: 'America/Bogota',
      defaultTaxRateBps: 1900,
      pricesIncludeTax: true,
    },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      aria-label={t('onboarding.title')}
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormField label={t('onboarding.name')} error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="organization" {...form.register('name')} />}
      </FormField>
      <FormField label={t('onboarding.type')}>
        {(control) => (
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select
                {...control}
                value={field.value}
                onValueChange={field.onChange}
                options={BUSINESS_TYPES.map((value) => ({
                  value,
                  label: t(`businessType.${value}`),
                }))}
              />
            )}
          />
        )}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('onboarding.currency')} hint={t('onboarding.currencyHint')}>
          {(control) => (
            <Controller
              control={form.control}
              name="currency"
              render={({ field }) => (
                <Select
                  {...control}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={CURRENCY_CODES.map((value) => ({
                    value,
                    label: t(`currency.${value}`),
                  }))}
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
                  options={TIME_ZONES.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
                />
              )}
            />
          )}
        </FormField>
      </div>
      <FormField label={t('onboarding.tax')}>
        {(control) => (
          <Controller
            control={form.control}
            name="defaultTaxRateBps"
            render={({ field }) => (
              <Select
                {...control}
                value={String(field.value)}
                onValueChange={(value) => {
                  field.onChange(Number(value));
                }}
                options={DEFAULT_TAX_OPTIONS.map((option) => ({
                  value: String(option.rateBps),
                  label: t(option.key),
                }))}
              />
            )}
          />
        )}
      </FormField>
      <Controller
        control={form.control}
        name="pricesIncludeTax"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="prices-include-tax" className="text-sm font-medium text-text">
              {t('onboarding.pricesIncludeTax')}
            </label>
            <Switch
              id="prices-include-tax"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </div>
        )}
      />
      {disabled ? <Text variant="danger">{t('onboarding.offline')}</Text> : null}
      {error ? (
        <Text variant="danger" role="alert">
          {errorMessage(error)}
        </Text>
      ) : null}
      <Button type="submit" size="lg" fullWidth loading={submitting} disabled={disabled}>
        {t('onboarding.submit')}
      </Button>
    </form>
  );
}
