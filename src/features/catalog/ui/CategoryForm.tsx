import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { t } from '@/shared/lib/i18n';
import { FormField, Input, NumberInput, Select } from '@/shared/ui';
import {
  CATEGORY_COLORS,
  categoryInputSchema,
  type Category,
  type CategoryInput,
} from '../domain/category';

export interface CategoryFormProps {
  category: Category | null;
  nextSortOrder: number;
  onSubmit: (input: CategoryInput) => void;
}

export function CategoryForm({ category, nextSortOrder, onSubmit }: CategoryFormProps) {
  const form = useForm({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: {
      name: category?.name ?? '',
      color: category?.color ?? 'primary',
      sortOrder: category?.sortOrder ?? nextSortOrder,
    },
  });
  const { errors } = form.formState;
  return (
    <form
      id="category-form"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormField label={t('common.name')} error={errors.name?.message}>
        {(control) => <Input {...control} {...form.register('name')} />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('catalog.field.color')}>
          {(control) => (
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <Select
                  {...control}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={CATEGORY_COLORS.map((value) => ({ value, label: t(`color.${value}`) }))}
                />
              )}
            />
          )}
        </FormField>
        <FormField label={t('catalog.field.order')} error={errors.sortOrder?.message}>
          {(control) => (
            <Controller
              control={form.control}
              name="sortOrder"
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
    </form>
  );
}
