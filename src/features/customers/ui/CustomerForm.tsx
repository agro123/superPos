import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { t } from '@/shared/lib/i18n';
import { FormField, Input } from '@/shared/ui';
import { customerInputSchema, type Customer } from '../domain/customer';

export interface CustomerFormProps {
  customer: Customer | null;
  onSubmit: (values: Pick<Customer, 'name' | 'documentId' | 'phone' | 'email' | 'notes'>) => void;
}

export function CustomerForm({ customer, onSubmit }: CustomerFormProps) {
  const form = useForm({
    resolver: zodResolver(customerInputSchema),
    defaultValues: {
      name: customer?.name ?? '',
      documentId: customer?.documentId ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      notes: customer?.notes ?? '',
    },
  });
  const { errors } = form.formState;
  return (
    <form
      id="customer-form"
      noValidate
      className="flex flex-col gap-4 p-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormField label={t('common.name')} error={errors.name?.message}>
        {(control) => <Input {...control} autoComplete="off" {...form.register('name')} />}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('customers.document')} optional error={errors.documentId?.message}>
          {(control) => <Input {...control} {...form.register('documentId')} />}
        </FormField>
        <FormField label={t('common.phone')} optional error={errors.phone?.message}>
          {(control) => (
            <Input {...control} type="tel" inputMode="tel" {...form.register('phone')} />
          )}
        </FormField>
      </div>
      <FormField label={t('common.email')} optional error={errors.email?.message}>
        {(control) => <Input {...control} type="email" {...form.register('email')} />}
      </FormField>
      <FormField label={t('common.notes')} optional error={errors.notes?.message}>
        {(control) => <Input {...control} {...form.register('notes')} />}
      </FormField>
    </form>
  );
}
