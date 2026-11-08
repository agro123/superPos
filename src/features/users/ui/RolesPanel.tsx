import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Synced } from '@/shared/domain/live';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  FormField,
  IconButton,
  Input,
  Modal,
  Select,
  Text,
  type DataTableColumn,
} from '@/shared/ui';
import { memberWrites, useMembers, useRoles } from '../application/useMembers';
import {
  customRoleInputSchema,
  ROLE_PRESETS,
  type CustomRole,
  type CustomRoleInput,
} from '../domain/customRole';
import { PERMISSIONS } from '../domain/permissions';

export interface RolesPanelProps {
  businessId: string;
  currentUid: string;
}

/** Roles personalizados (cajero, inventario, mesero…) con permisos configurables. */
export function RolesPanel({ businessId, currentUid }: RolesPanelProps) {
  const roles = useRoles(businessId);
  const members = useMembers(businessId);
  const [editing, setEditing] = useState<{ id: string | null; input: CustomRoleInput } | null>(
    null,
  );
  const usage = (id: string) => (members.data ?? []).filter((m) => m.customRoleId === id).length;
  const valid = editing ? customRoleInputSchema.safeParse(editing.input).success : false;

  const columns: DataTableColumn<Synced<CustomRole>>[] = [
    { id: 'name', header: t('common.name'), cell: (r) => r.name, sortValue: (r) => r.name },
    {
      id: 'permissions',
      header: t('roles.permissions'),
      hideOnMobile: true,
      cell: (r) => r.permissions.map((p) => t(`permission.${p}`)).join(', '),
    },
    {
      id: 'members',
      header: t('roles.members'),
      align: 'right',
      cell: (r) => formatNumber(usage(r.id)),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      align: 'right',
      cell: (r) => (
        <IconButton
          label={t('roles.delete', { name: r.name })}
          icon={<Trash2 />}
          variant="danger"
          disabled={usage(r.id) > 0}
          onClick={(event) => {
            event.stopPropagation();
            memberWrites.deleteRole(businessId, r.id);
          }}
        />
      ),
    },
  ];

  const togglePermission = (permission: (typeof PERMISSIONS)[number], on: boolean) => {
    if (!editing) return;
    const permissions = on
      ? [...editing.input.permissions, permission]
      : editing.input.permissions.filter((p) => p !== permission);
    setEditing({ ...editing, input: { ...editing.input, permissions } });
  };

  return (
    <section aria-labelledby="roles-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="roles-title" className="text-base font-semibold text-text">
            {t('roles.title')}
          </h3>
          <Text variant="caption">{t('roles.hint')}</Text>
        </div>
        <Button
          leftIcon={<Plus aria-hidden className="size-5" />}
          onClick={() => {
            setEditing({ id: null, input: { name: '', permissions: [] } });
          }}
        >
          {t('roles.new')}
        </Button>
      </div>
      <DataTable
        caption={t('roles.title')}
        columns={columns}
        rows={roles.data ?? []}
        getRowId={(r) => r.id}
        loading={roles.isPending}
        onRowClick={(r) => {
          setEditing({ id: r.id, input: { name: r.name, permissions: [...r.permissions] } });
        }}
        emptyState={
          <EmptyState
            icon={<ShieldCheck />}
            title={t('roles.empty')}
            description={t('roles.emptyHint')}
          />
        }
      />
      <Modal
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing?.id ? t('roles.edit') : t('roles.new')}
        description={
          editing?.id && usage(editing.id) > 0
            ? t('roles.editHint', { count: formatNumber(usage(editing.id)) })
            : undefined
        }
        footer={
          <Button
            disabled={!valid}
            onClick={() => {
              if (!editing || !valid) return;
              memberWrites.saveRole(
                businessId,
                editing.id,
                { ...editing.input, name: editing.input.name.trim() },
                members.data ?? [],
                currentUid,
              );
              setEditing(null);
            }}
          >
            {t('common.save')}
          </Button>
        }
      >
        {editing ? (
          <div className="flex flex-col gap-4">
            {editing.id ? null : (
              <FormField label={t('roles.preset')} optional>
                {(control) => (
                  <Select
                    {...control}
                    value=""
                    onValueChange={(key) => {
                      const preset = ROLE_PRESETS.find((p) => p.key === key);
                      if (preset)
                        setEditing({
                          id: null,
                          input: {
                            name: t(`roles.preset.${preset.key}`),
                            permissions: [...preset.permissions],
                          },
                        });
                    }}
                    options={ROLE_PRESETS.map((p) => ({
                      value: p.key,
                      label: t(`roles.preset.${p.key}`),
                    }))}
                  />
                )}
              </FormField>
            )}
            <FormField label={t('common.name')}>
              {(control) => (
                <Input
                  {...control}
                  maxLength={40}
                  value={editing.input.name}
                  onChange={(e) => {
                    setEditing({ ...editing, input: { ...editing.input, name: e.target.value } });
                  }}
                />
              )}
            </FormField>
            <fieldset className="flex flex-col">
              <legend className="mb-1 text-sm font-medium text-text">
                {t('roles.permissions')}
              </legend>
              {PERMISSIONS.map((permission) => (
                <div key={permission} className="flex min-h-touch items-center gap-3">
                  <Checkbox
                    id={`role-perm-${permission}`}
                    checked={editing.input.permissions.includes(permission)}
                    onCheckedChange={(checked) => {
                      togglePermission(permission, checked);
                    }}
                  />
                  <label htmlFor={`role-perm-${permission}`} className="text-sm text-text">
                    {t(`permission.${permission}`)}
                  </label>
                </div>
              ))}
            </fieldset>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
