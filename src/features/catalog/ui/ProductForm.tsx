import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatRateBps } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { FormField, Input, MoneyInput, NumberInput, Select, Switch } from '@/shared/ui';
import type { Category } from '../domain/category';
import {
  MAX_IMAGE_BYTES,
  productInputSchema,
  type Product,
  type ProductInput,
  type ValidProductInput,
} from '../domain/product';

const NO_CATEGORY = '__none';

export interface ProductFormProps {
  product: Product | null;
  categories: readonly Category[];
  taxRates: readonly { id: string; name: string; rateBps: number }[];
  defaultTaxRateBps: number;
  currency: CurrencyCode;
  onSubmit: (input: ValidProductInput, image: File | null) => void;
}

function defaults(product: Product | null, defaultTaxRateBps: number): ProductInput {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    categoryId: product?.categoryId ?? null,
    priceMinor: product?.priceMinor ?? Number.NaN,
    costMinor: product?.costMinor ?? null,
    taxRateBps: product?.taxRateBps ?? defaultTaxRateBps,
    trackStock: product?.trackStock ?? true,
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    active: product?.active ?? true,
    initialStock: 0,
  };
}

/** Formulario de producto validado con `productInputSchema` (fuente única de validación). */
export function ProductForm({
  product,
  categories,
  taxRates,
  defaultTaxRateBps,
  currency,
  onSubmit,
}: ProductFormProps) {
  const form = useForm({
    resolver: zodResolver(productInputSchema),
    defaultValues: defaults(product, defaultTaxRateBps),
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | undefined>();
  const { errors } = form.formState;
  const trackStock = useWatch({ control: form.control, name: 'trackStock' });

  const switchField = (name: 'trackStock' | 'active', label: string) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={`product-${name}`} className="text-sm font-medium text-text">
            {label}
          </label>
          <Switch id={`product-${name}`} checked={field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );

  return (
    <form
      id="product-form"
      noValidate
      className="flex flex-col gap-4 p-4"
      onSubmit={form.handleSubmit((values) => {
        onSubmit(values, image);
      })}
    >
      <FormField label={t('catalog.field.name')} error={errors.name?.message}>
        {(control) => <Input {...control} {...form.register('name')} />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('catalog.field.price')}
          error={errors.priceMinor ? t('catalog.priceRequired') : undefined}
        >
          {(control) => (
            <Controller
              control={form.control}
              name="priceMinor"
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
        <FormField label={t('catalog.field.cost')} optional error={errors.costMinor?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="costMinor"
              render={({ field }) => (
                <MoneyInput
                  {...control}
                  currency={currency}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          )}
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('catalog.field.category')}>
          {(control) => (
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  {...control}
                  value={field.value ?? NO_CATEGORY}
                  onValueChange={(value) => {
                    field.onChange(value === NO_CATEGORY ? null : value);
                  }}
                  options={[
                    { value: NO_CATEGORY, label: t('catalog.noCategory') },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              )}
            />
          )}
        </FormField>
        <FormField label={t('catalog.field.tax')}>
          {(control) => (
            <Controller
              control={form.control}
              name="taxRateBps"
              render={({ field }) => (
                <Select
                  {...control}
                  value={String(field.value)}
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                  }}
                  options={taxRates.map((rate) => ({
                    value: String(rate.rateBps),
                    label: `${rate.name} (${formatRateBps(rate.rateBps)})`,
                  }))}
                />
              )}
            />
          )}
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('catalog.field.sku')} optional error={errors.sku?.message}>
          {(control) => <Input {...control} {...form.register('sku')} />}
        </FormField>
        <FormField label={t('catalog.field.barcode')} optional error={errors.barcode?.message}>
          {(control) => <Input {...control} inputMode="numeric" {...form.register('barcode')} />}
        </FormField>
      </div>
      {switchField('trackStock', t('catalog.field.trackStock'))}
      {trackStock ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {product ? null : (
            <FormField label={t('catalog.field.initialStock')} error={errors.initialStock?.message}>
              {(control) => (
                <Controller
                  control={form.control}
                  name="initialStock"
                  render={({ field }) => (
                    <NumberInput
                      {...control}
                      min={0}
                      allowDecimal
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v ?? 0);
                      }}
                    />
                  )}
                />
              )}
            </FormField>
          )}
          <FormField
            label={t('catalog.field.lowStock')}
            hint={t('catalog.field.lowStockHint')}
            error={errors.lowStockThreshold?.message}
          >
            {(control) => (
              <Controller
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <NumberInput
                    {...control}
                    min={0}
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v ?? 0);
                    }}
                  />
                )}
              />
            )}
          </FormField>
        </div>
      ) : null}
      {switchField('active', t('catalog.field.active'))}
      <FormField
        label={t('catalog.field.image')}
        optional
        hint={t('catalog.field.imageHint')}
        error={imageError}
      >
        {(control) => (
          <Input
            {...control}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="py-2"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              const tooLarge = file !== null && file.size > MAX_IMAGE_BYTES;
              setImageError(tooLarge ? t('catalog.imageTooLarge') : undefined);
              setImage(tooLarge ? null : file);
            }}
          />
        )}
      </FormField>
    </form>
  );
}
