import { Plus, Truck } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { Can, usePermission } from '@/features/users';
import type { Synced } from '@/shared/domain/live';
import { t } from '@/shared/lib/i18n';
import {
  Button,
  DataTable,
  EmptyState,
  FormField,
  Input,
  Modal,
  type DataTableColumn,
} from '@/shared/ui';
import { saveSupplier } from '../application/useInventory';
import type { Supplier } from '../domain/stock';

export interface SuppliersTabProps {
  businessId: string;
  suppliers: readonly Synced<Supplier>[];
  loading: boolean;
}

const EMPTY = { name: '', phone: '', email: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Proveedores (nombre, teléfono/WhatsApp, email) para compras y pedidos. */
export function SuppliersTab({ businessId, suppliers, loading }: SuppliersTabProps) {
  const user = useCurrentUser();
  const canEdit = usePermission('inventory.adjust');
  const [editing, setEditing] = useState<{ id: string | null; fields: typeof EMPTY } | null>(null);
  const fields = editing?.fields ?? EMPTY;
  const valid = fields.name.trim().length > 0 && (fields.email === '' || EMAIL.test(fields.email));
  const set = (key: keyof typeof EMPTY) => (event: { target: { value: string } }) => {
    if (editing)
      setEditing({ ...editing, fields: { ...editing.fields, [key]: event.target.value } });
  };
  const columns: DataTableColumn<Synced<Supplier>>[] = [
    { id: 'name', header: t('common.name'), cell: (s) => s.name, sortValue: (s) => s.name },
    { id: 'phone', header: t('common.phone'), cell: (s) => s.phone ?? '—' },
    { id: 'email', header: t('common.email'), hideOnMobile: true, cell: (s) => s.email ?? '—' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Can permission="inventory.adjust">
        <Button
          className="self-end"
          leftIcon={<Plus aria-hidden className="size-5" />}
          onClick={() => {
            setEditing({ id: null, fields: EMPTY });
          }}
        >
          {t('inventory.newSupplier')}
        </Button>
      </Can>
      <DataTable
        caption={t('inventory.suppliers')}
        columns={columns}
        rows={suppliers}
        getRowId={(s) => s.id}
        loading={loading}
        onRowClick={
          canEdit
            ? (s) => {
                setEditing({
                  id: s.id,
                  fields: { name: s.name, phone: s.phone ?? '', email: s.email ?? '' },
                });
              }
            : undefined
        }
        emptyState={<EmptyState icon={<Truck />} title={t('inventory.noSuppliers')} />}
      />
      <Modal
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing?.id ? t('inventory.editSupplier') : t('inventory.newSupplier')}
        footer={
          <Button
            disabled={!valid}
            onClick={() => {
              if (!editing || !valid) return;
              saveSupplier(
                businessId,
                editing.id,
                {
                  name: fields.name.trim(),
                  phone: fields.phone.trim() || null,
                  email: fields.email.trim() || null,
                },
                user.uid,
              );
              setEditing(null);
            }}
          >
            {t('common.save')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label={t('common.name')}>
            {(control) => (
              <Input {...control} maxLength={120} value={fields.name} onChange={set('name')} />
            )}
          </FormField>
          <FormField label={t('common.phone')} optional>
            {(control) => (
              <Input
                {...control}
                type="tel"
                maxLength={30}
                value={fields.phone}
                onChange={set('phone')}
              />
            )}
          </FormField>
          <FormField
            label={t('common.email')}
            optional
            error={fields.email && !EMAIL.test(fields.email) ? t('errors.validation') : undefined}
          >
            {(control) => (
              <Input {...control} type="email" value={fields.email} onChange={set('email')} />
            )}
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
