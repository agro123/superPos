import { useState } from 'react';
import { businessWrites, useActiveBusiness } from '@/features/business';
import { useToast } from '@/shared/hooks/useToast';
import { formatRateBps } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Select, Switch } from '@/shared/ui';

/** Formulario de taxes (Configuración y asistente de configuración inicial). */
export function TaxesPanel() {
  const { business, taxes } = useActiveBusiness();
  const toast = useToast();
  const [pricesIncludeTax, setPricesIncludeTax] = useState(taxes.pricesIncludeTax);
  const [defaultRateBps, setDefaultRateBps] = useState(taxes.defaultRateBps);
  const dirty =
    pricesIncludeTax !== taxes.pricesIncludeTax || defaultRateBps !== taxes.defaultRateBps;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="prices-include-tax" className="text-sm font-medium text-text">
          {t('onboarding.pricesIncludeTax')}
        </label>
        <Switch
          id="prices-include-tax"
          checked={pricesIncludeTax}
          onCheckedChange={setPricesIncludeTax}
        />
      </div>
      <FormField label={t('settings.defaultRate')}>
        {(control) => (
          <Select
            {...control}
            value={String(defaultRateBps)}
            onValueChange={(value) => {
              setDefaultRateBps(Number(value));
            }}
            options={taxes.rates.map((rate) => ({
              value: String(rate.rateBps),
              label: `${rate.name} (${formatRateBps(rate.rateBps)})`,
            }))}
          />
        )}
      </FormField>
      <div>
        <p className="text-sm font-medium text-text">{t('settings.rates')}</p>
        <ul className="mt-1 flex flex-wrap gap-2 text-sm text-text-muted">
          {taxes.rates.map((rate) => (
            <li key={rate.id} className="rounded-full bg-surface-muted px-3 py-1">
              {rate.name}
            </li>
          ))}
        </ul>
      </div>
      <Button
        className="self-start"
        disabled={!dirty}
        onClick={() => {
          businessWrites.updateTaxes(business.id, {
            pricesIncludeTax,
            defaultRateBps,
            rates: [...taxes.rates],
          });
          toast({ title: t('common.saved'), tone: 'success' });
        }}
      >
        {t('common.save')}
      </Button>
    </div>
  );
}
