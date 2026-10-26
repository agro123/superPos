import { Plus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { Can, usePermission } from '@/features/users';
import type { Synced } from '@/shared/domain/live';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  PageHeader,
  type DataTableColumn,
} from '@/shared/ui';
import { customerWrites, useCustomers } from '../application/useCustomers';
import type { Customer } from '../domain/customer';
import { CustomerForm } from '../ui/CustomerForm';

type Editing = { customer: Customer | null } | null;

export default function CustomersPage() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const online = useOnlineStatus();
  const canManage = usePermission('customers.manage');
  const customers = useCustomers(business.id);
  const [editing, setEditing] = useState<Editing>(null);

  const columns: DataTableColumn<Synced<Customer>>[] = [
    {
      id: 'name',
      header: t('common.name'),
      sortValue: (c) => c.name,
      cell: (c) => (
        <span className="flex flex-col">
          {c.name}
          {c.pendingSync ? <Badge className="self-start">{t('common.pendingSync')}</Badge> : null}
        </span>
      ),
    },
    {
      id: 'document',
      header: t('customers.document'),
      cell: (c) => c.documentId ?? '—',
      hideOnMobile: true,
    },
    { id: 'phone', header: t('common.phone'), cell: (c) => c.phone ?? '—' },
    { id: 'email', header: t('common.email'), cell: (c) => c.email ?? '—', hideOnMobile: true },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('customers.title')}
        description={t('customers.description')}
        actions={
          <Can permission="customers.manage">
            <Button
              leftIcon={<Plus aria-hidden className="size-5" />}
              onClick={() => {
                setEditing({ customer: null });
              }}
            >
              {t('customers.new')}
            </Button>
          </Can>
        }
      />
      {customers.isError ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(customers.error)}
          action={<Button onClick={() => void customers.refetch()}>{t('common.retry')}</Button>}
        />
      ) : (
        <DataTable
          caption={t('customers.table')}
          columns={columns}
          rows={customers.data ?? []}
          getRowId={(c) => c.id}
          loading={customers.isPending}
          searchText={(c) => `${c.name} ${c.documentId ?? ''} ${c.phone ?? ''}`}
          searchPlaceholder={t('customers.search')}
          onRowClick={
            canManage
              ? (customer) => {
                  setEditing({ customer });
                }
              : undefined
          }
          emptyState={
            <EmptyState
              icon={<UsersRound />}
              title={t('customers.empty')}
              description={t('customers.emptyHint')}
            />
          }
        />
      )}
      <Drawer
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing?.customer ? t('customers.edit') : t('customers.new')}
        footer={
          <Button type="submit" form="customer-form" size="lg" fullWidth>
            {t('common.save')}
          </Button>
        }
      >
        {editing ? (
          <CustomerForm
            customer={editing.customer}
            onSubmit={(values) => {
              if (editing.customer)
                customerWrites.updateCustomer(business.id, editing.customer.id, values);
              else customerWrites.createCustomer(business.id, values, user.uid);
              toast({
                title: online ? t('common.saved') : t('common.savedOffline'),
                tone: 'success',
              });
              setEditing(null);
            }}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
