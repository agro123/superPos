import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Select, Text } from '@/shared/ui';
import { memberWrites } from '../application/useMembers';
import { invitationInputSchema } from '../domain/invitation';
import { ROLES } from '../domain/permissions';

export interface InviteMemberFormProps {
  businessId: string;
  businessName: string;
  invitedBy: string;
}

export function InviteMemberForm({ businessId, businessName, invitedBy }: InviteMemberFormProps) {
  const toast = useToast();
  const form = useForm({
    resolver: zodResolver(invitationInputSchema),
    defaultValues: { email: '', role: 'employee' as const, extraPermissions: [] },
  });

  return (
    <form
      noValidate
      aria-label={t('employees.invite')}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
      onSubmit={form.handleSubmit((values) => {
        memberWrites.inviteMember(businessId, businessName, values, invitedBy);
        toast({ title: t('employees.invited', { email: values.email }), tone: 'success' });
        form.reset();
      })}
    >
      <Text variant="strong">{t('employees.invite')}</Text>
      <Text variant="caption">{t('employees.inviteHint')}</Text>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <FormField label={t('common.email')} error={form.formState.errors.email?.message}>
          {(control) => (
            <Input {...control} type="email" autoComplete="off" {...form.register('email')} />
          )}
        </FormField>
        <FormField label={t('employees.role')}>
          {(control) => (
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  {...control}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={ROLES.map((value) => ({ value, label: t(`role.${value}`) }))}
                />
              )}
            />
          )}
        </FormField>
        <Button type="submit">{t('employees.invite')}</Button>
      </div>
    </form>
  );
}
