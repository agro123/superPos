import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Button, Checkbox, Drawer, FormField, Select, Switch, Text } from '@/shared/ui';
import { memberWrites, useRoles } from '../application/useMembers';
import { assignmentOf, roleChoiceOf } from '../domain/customRole';
import { memberUpdateSchema, type Member } from '../domain/member';
import { grantablePermissions } from '../domain/permissions';

export interface MemberEditorProps {
  businessId: string;
  member: Member;
  onClose: () => void;
}

/** Edita rol, permisos extra y estado de un miembro (requiere `users.manage`). */
export function MemberEditor({ businessId, member, onClose }: MemberEditorProps) {
  const toast = useToast();
  const roles = useRoles(businessId);
  const form = useForm({
    resolver: zodResolver(memberUpdateSchema),
    defaultValues: {
      role: member.role,
      extraPermissions: member.extraPermissions,
      status: member.status,
      customRoleId: member.customRoleId,
    },
  });
  const customRoleId = useWatch({ control: form.control, name: 'customRoleId' });
  const role = useWatch({ control: form.control, name: 'role' });

  const submit = form.handleSubmit((values) => {
    if (values.role === 'custom') {
      // Los permisos de un rol personalizado son los del rol: se toman al guardar.
      const assignment = assignmentOf(
        roleChoiceOf('custom', values.customRoleId),
        roles.data ?? [],
      );
      if (!assignment) return;
      memberWrites.updateMember(businessId, member.id, { ...assignment, status: values.status });
      toast({ title: t('common.saved'), tone: 'success' });
      onClose();
      return;
    }
    const allowedExtras = new Set(grantablePermissions(values.role));
    memberWrites.updateMember(businessId, member.id, {
      ...values,
      customRoleId: null,
      extraPermissions: values.extraPermissions.filter((permission) =>
        allowedExtras.has(permission),
      ),
    });
    toast({ title: t('common.saved'), tone: 'success' });
    onClose();
  });

  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('employees.edit', { name: member.displayName })}
      description={member.email}
      footer={
        <Button size="lg" fullWidth onClick={() => void submit()}>
          {t('common.save')}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-5 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <FormField label={t('employees.role')}>
          {(control) => (
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select
                  {...control}
                  value={roleChoiceOf(field.value, customRoleId)}
                  onValueChange={(choice) => {
                    const assignment = assignmentOf(choice, roles.data ?? []);
                    if (!assignment) return;
                    field.onChange(assignment.role);
                    form.setValue('customRoleId', assignment.customRoleId);
                  }}
                  options={[
                    { value: 'admin', label: t('role.admin') },
                    { value: 'employee', label: t('role.employee') },
                    ...(roles.data ?? []).map((r) => ({ value: `custom:${r.id}`, label: r.name })),
                  ]}
                />
              )}
            />
          )}
        </FormField>
        {role !== 'custom' && grantablePermissions(role).length > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-text">
              {t('employees.extraPermissions')}
            </legend>
            <Text variant="caption">{t('employees.extraPermissionsHint')}</Text>
            <Controller
              control={form.control}
              name="extraPermissions"
              render={({ field }) => (
                <ul className="flex flex-col">
                  {grantablePermissions(role).map((permission) => (
                    <li key={permission} className="flex min-h-touch items-center gap-3">
                      <Checkbox
                        id={`perm-${permission}`}
                        checked={field.value.includes(permission)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked
                              ? [...field.value, permission]
                              : field.value.filter((p) => p !== permission),
                          );
                        }}
                      />
                      <label htmlFor={`perm-${permission}`} className="text-sm text-text">
                        {t(`permission.${permission}`)}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            />
          </fieldset>
        ) : null}
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="member-status" className="text-sm font-medium text-text">
                {t('employees.statusLabel')}
              </label>
              <Switch
                id="member-status"
                checked={field.value === 'active'}
                onCheckedChange={(checked) => {
                  field.onChange(checked ? 'active' : 'disabled');
                }}
              />
            </div>
          )}
        />
      </form>
    </Drawer>
  );
}
