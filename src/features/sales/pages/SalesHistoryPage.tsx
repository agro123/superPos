import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  PageHeader,
  Select,
  type DataTableColumn,
} from '@/shared/ui';
import { useSalesSince } from '../application/useSales';
import type { SaleRecord } from '../domain/ports';
import { SaleDetail } from '../ui/SaleDetail';

const RANGES = [7, 30, 90] as const;

export default function SalesHistoryPage() {
  const { business } = useActiveBusiness();
  const [days, setDays] = useState<number>(7);
  const { query, sales, voided } = useSalesSince(business.id, days);
  const [selected, setSelected] = useState<SaleRecord | null>(null);
  const money = (sale: SaleRecord) => formatMoney(sale.totalMinor, business.currency);

  const columns: DataTableColumn<SaleRecord>[] = [
    {
      id: 'number',
      header: t('sales.col.number'),
      cell: (s) => s.number,
      sortValue: (s) => s.number,
    },
    {
      id: 'date',
      header: t('common.date'),
      cell: (s) => formatDateTime(s.occurredAt, business.timezone),
      sortValue: (s) => s.occurredAt.getTime(),
    },
    {
      id: 'items',
      header: t('sales.col.items'),
      align: 'right',
      hideOnMobile: true,
      cell: (s) =>
        formatNumber(s.lines.reduce((sum, line) => sum + (line.voided ? 0 : line.quantity), 0)),
    },
    {
      id: 'method',
      header: t('sales.col.method'),
      hideOnMobile: true,
      cell: (s) => s.payments.map((p) => t(`payment.${p.method}`)).join(' + '),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (s) => (
        <span className="flex flex-wrap gap-1">
          {voided.has(s.id) ? <Badge tone="danger">{t('sales.voided')}</Badge> : null}
          {s.pendingSync ? <Badge tone="warning">{t('common.pendingSync')}</Badge> : null}
        </span>
      ),
    },
    {
      id: 'total',
      header: t('common.total'),
      align: 'right',
      cell: money,
      sortValue: (s) => s.totalMinor,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t('sales.title')} description={t('sales.description')} />
      {query.isError ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(query.error)}
          action={<Button onClick={() => void query.refetch()}>{t('common.retry')}</Button>}
        />
      ) : (
        <DataTable
          caption={t('sales.table')}
          columns={columns}
          rows={sales}
          getRowId={(s) => s.id}
          loading={query.isPending}
          searchText={(s) => `${s.number} ${s.lines.map((line) => line.name).join(' ')}`}
          searchPlaceholder={t('sales.search')}
          onRowClick={setSelected}
          toolbar={
            <Select
              aria-label={t('sales.range')}
              className="sm:w-48"
              value={String(days)}
              onValueChange={(value) => {
                setDays(Number(value));
              }}
              options={RANGES.map((value) => ({
                value: String(value),
                label: t('common.lastDays', { days: value }),
              }))}
            />
          }
          emptyState={
            <EmptyState
              icon={<ClipboardList />}
              title={t('sales.empty')}
              description={t('sales.emptyHint')}
            />
          }
        />
      )}
      <SaleDetail
        sale={selected}
        voided={selected ? voided.has(selected.id) : false}
        businessName={business.name}
        currency={business.currency}
        timeZone={business.timezone}
        onClose={() => {
          setSelected(null);
        }}
      />
    </div>
  );
}
