import { Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { Can } from '@/features/users';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { normalizeSearch } from '@/shared/lib/text';
import { Badge, Button, Modal, SearchBar, Text } from '@/shared/ui';
import { customerWrites, useCustomers } from '../application/useCustomers';
import { balanceOf, type CustomerBalance } from '../domain/credit';
import { CustomerForm } from './CustomerForm';

export interface CustomerPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  currency: CurrencyCode;
  balances: ReadonlyMap<string, CustomerBalance>;
  selectedId: string | null;
  /** `null` = venta sin cliente (consumidor final). */
  onSelect: (customerId: string | null) => void;
}

/** Selector de cliente del POS (opcional), con alta rápida y saldo fiado visible. */
export function CustomerPickerDialog({
  open,
  onOpenChange,
  businessId,
  currency,
  balances,
  selectedId,
  onSelect,
}: CustomerPickerDialogProps) {
  const user = useCurrentUser();
  const customers = useCustomers(businessId);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const needle = normalizeSearch(search);
  const visible = (customers.data ?? []).filter(
    (c) =>
      !needle ||
      normalizeSearch(`${c.name} ${c.documentId ?? ''} ${c.phone ?? ''}`).includes(needle),
  );
  const close = (next: boolean) => {
    if (!next) {
      setCreating(false);
      setSearch('');
    }
    onOpenChange(next);
  };
  const pick = (id: string | null) => {
    onSelect(id);
    close(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={creating ? t('customers.new') : t('pos.customer.pick')}
      footer={
        creating ? (
          <Button type="submit" form="pos-customer-form">
            {t('common.save')}
          </Button>
        ) : null
      }
    >
      {creating ? (
        <CustomerForm
          customer={null}
          formId="pos-customer-form"
          onSubmit={(values) => {
            pick(customerWrites.createCustomer(businessId, values, user.uid));
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <SearchBar
            value={search}
            onValueChange={setSearch}
            label={t('customers.search')}
            placeholder={t('customers.search')}
          />
          <Can permission="customers.manage">
            <Button
              variant="outline"
              leftIcon={<Plus aria-hidden className="size-5" />}
              onClick={() => {
                setCreating(true);
              }}
            >
              {t('customers.new')}
            </Button>
          </Can>
          <ul
            aria-label={t('customers.table')}
            className="flex max-h-80 flex-col gap-1 overflow-y-auto"
          >
            <li>
              <button
                type="button"
                aria-pressed={selectedId === null}
                onClick={() => {
                  pick(null);
                }}
                className="flex min-h-touch w-full items-center gap-2 rounded-md px-3 text-left hover:bg-surface-muted aria-pressed:bg-primary-soft"
              >
                <UserRound aria-hidden className="size-5 text-text-muted" />
                {t('pos.customer.none')}
              </button>
            </li>
            {visible.map((c) => {
              const debt = balanceOf(balances, c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === c.id}
                    onClick={() => {
                      pick(c.id);
                    }}
                    className="flex min-h-touch w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left hover:bg-surface-muted aria-pressed:bg-primary-soft"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium text-text">{c.name}</span>
                      {c.documentId ? <Text variant="caption">{c.documentId}</Text> : null}
                    </span>
                    {debt > 0 ? (
                      <Badge tone="danger">
                        {t('credit.owes', { amount: formatMoney(debt, currency) })}
                      </Badge>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}
