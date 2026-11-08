import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { PLAN_LIMITS, type BusinessPlan } from '@/shared/domain/plan';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Input, Select, Text } from '@/shared/ui';
import { memberWrites, useRoles } from '../application/useMembers';
import { assignmentOf, roleChoiceOf } from '../domain/customRole';
import { invitationInputSchema } from '../domain/invitation';

export interface InviteMemberFormProps {
  businessId: string;
  businessName: string;
  invitedBy: string;
  plan: BusinessPlan;
  /** No quedan cupos de trabajador en el plan. */
  seatsFull: boolean;
}

export function InviteMemberForm({
  businessId,
  businessName,
  invitedBy,
  plan,
  seatsFull,
}: InviteMemberFormProps) {
  const toast = useToast();
  const roles = useRoles(businessId);
  const form = useForm({
    resolver: zodResolver(invitationInputSchema),
    defaultValues: {
      email: '',
      role: 'employee' as const,
      extraPermissions: [],
      customRoleId: null as string | null,
    },
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
      {seatsFull ? (
        <Text variant="caption" role="note">
          {t('plan.seatsFullInvite')}
        </Text>
      ) : null}
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
                  value={roleChoiceOf(field.value, form.getValues('customRoleId'))}
                  onValueChange={(choice) => {
                    const assignment = assignmentOf(choice, roles.data ?? []);
                    if (!assignment) return;
                    field.onChange(assignment.role);
                    form.setValue('customRoleId', assignment.customRoleId);
                    form.setValue('extraPermissions', assignment.extraPermissions);
                  }}
                  options={[
                    {
                      value: 'admin',
                      label: PLAN_LIMITS[plan].extraAdmins
                        ? t('role.admin')
                        : t('plan.adminPremium'),
                      disabled: !PLAN_LIMITS[plan].extraAdmins,
                    },
                    { value: 'employee', label: t('role.employee') },
                    ...(roles.data ?? []).map((r) => ({ value: `custom:${r.id}`, label: r.name })),
                  ]}
                />
              )}
            />
          )}
        </FormField>
        <Button type="submit" disabled={seatsFull}>
          {t('employees.invite')}
        </Button>
      </div>
    </form>
  );
}
