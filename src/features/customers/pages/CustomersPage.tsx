import { Plus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { Can, usePermission } from '@/features/users';
import type { Synced } from '@/shared/domain/live';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatDate, formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  Button,
  Switch,
  DataTable,
  Drawer,
  EmptyState,
  PageHeader,
  type DataTableColumn,
} from '@/shared/ui';
import { customerWrites, useCustomerBalances, useCustomers } from '../application/useCustomers';
import { balanceOf } from '../domain/credit';
import type { Customer } from '../domain/customer';
import { CreditPaymentDialog } from '../ui/CreditPaymentDialog';
import { CustomerForm } from '../ui/CustomerForm';

type Editing = { customer: Customer | null } | null;

export default function CustomersPage() {
  const { business, paymentMethods } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const online = useOnlineStatus();
  const canManage = usePermission('customers.manage');
  const customers = useCustomers(business.id);
  const [editing, setEditing] = useState<Editing>(null);
  const credit = useCustomerBalances(business.id);
  const [onlyDebtors, setOnlyDebtors] = useState(false);
  const [paying, setPaying] = useState<Customer | null>(null);
  const debtOf = (c: Customer) => balanceOf(credit.balances, c.id);
  const rows = (customers.data ?? []).filter((c) => !onlyDebtors || debtOf(c) > 0);

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
    {
      id: 'balance',
      header: t('credit.col.balance'),
      align: 'right',
      sortValue: (c) => debtOf(c),
      cell: (c) => {
        const debt = debtOf(c);
        if (debt <= 0) return '—';
        const since = credit.balances.get(c.id)?.lastCreditAt;
        return (
          <span className="flex flex-col items-end gap-1">
            <Badge tone="danger">{formatMoney(debt, business.currency)}</Badge>
            {since ? (
              <span className="text-xs text-text-muted">
                {t('credit.lastCredit', { date: formatDate(since, business.timezone) })}
              </span>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                setPaying(c);
              }}
            >
              {t('credit.pay')}
            </Button>
          </span>
        );
      },
    },
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
      <label className="flex items-center gap-3 self-start text-sm font-medium text-text">
        <Switch checked={onlyDebtors} onCheckedChange={setOnlyDebtors} />
        {t('credit.onlyDebtors')}
      </label>
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
          rows={rows}
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
      <CreditPaymentDialog
        key={paying?.id ?? 'none'}
        customer={paying}
        balance={paying ? debtOf(paying) : balanceOf(credit.balances, null)}
        businessId={business.id}
        currency={business.currency}
        methods={paymentMethods}
        onClose={() => {
          setPaying(null);
        }}
        onRecorded={() => {
          toast({ title: t('credit.recorded'), tone: 'success' });
          setPaying(null);
        }}
      />
    </div>
  );
}
