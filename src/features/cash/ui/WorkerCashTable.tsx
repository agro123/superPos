import { UsersRound } from 'lucide-react';
import {
  addMoney,
  money as toMoney,
  ZERO_MONEY,
  type CurrencyCode,
  type Money,
} from '@/shared/domain/money';
import type { TenderMethod } from '@/shared/domain/payment';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { DataTable, EmptyState, type DataTableColumn } from '@/shared/ui';
import type { WorkerCashSummary } from '../domain/movements';

export interface WorkerCashTableProps {
  caption: string;
  rows: readonly WorkerCashSummary[];
  loading: boolean;
  currency: CurrencyCode;
  workerName: (uid: string) => string;
}

const OTHER: TenderMethod[] = ['card', 'transfer', 'wallet', 'other'];

/** Totales de caja por trabajador: turnos, ventas, efectivo, otros medios, fiado y arqueo. */
export function WorkerCashTable({
  caption,
  rows,
  loading,
  currency,
  workerName,
}: WorkerCashTableProps) {
  const money = (amount: Money) => formatMoney(amount, currency);
  const signed = (value: number) =>
    value === 0 ? money(ZERO_MONEY) : `${value < 0 ? '−' : '+'} ${money(toMoney(Math.abs(value)))}`;
  const columns: DataTableColumn<WorkerCashSummary>[] = [
    {
      id: 'worker',
      header: t('cash.col.worker'),
      cell: (r) => workerName(r.uid),
      sortValue: (r) => workerName(r.uid),
    },
    {
      id: 'shifts',
      header: t('cash.col.shifts'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => `${formatNumber(r.shiftsOpened)} / ${formatNumber(r.shiftsClosed)}`,
    },
    {
      id: 'sales',
      header: t('cash.col.sales'),
      align: 'right',
      cell: (r) => formatNumber(r.salesCount),
    },
    {
      id: 'voids',
      header: t('cash.col.voids'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => formatNumber(r.voidsCount),
    },
    {
      id: 'cashIn',
      header: t('cash.cashIn'),
      align: 'right',
      cell: (r) => money(r.cashIn),
      sortValue: (r) => r.cashIn,
    },
    {
      id: 'change',
      header: t('cash.col.change'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => money(r.changeGiven),
    },
    {
      id: 'expenses',
      header: t('cash.col.expenses'),
      align: 'right',
      cell: (r) => money(r.expenses),
    },
    {
      id: 'other',
      header: t('cash.col.other'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => money(addMoney(...OTHER.map((m) => r.byMethod[m] ?? ZERO_MONEY))),
    },
    {
      id: 'credit',
      header: t('cash.creditSold'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => money(r.byMethod.credit ?? ZERO_MONEY),
    },
    {
      id: 'collected',
      header: t('cash.col.collected'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => money(r.creditCollected),
    },
    {
      id: 'difference',
      header: t('cash.col.difference'),
      align: 'right',
      cell: (r) => signed(r.difference),
      sortValue: (r) => r.difference,
    },
  ];
  return (
    <DataTable
      caption={caption}
      columns={columns}
      rows={rows}
      getRowId={(r) => r.uid}
      loading={loading}
      emptyState={<EmptyState icon={<UsersRound />} title={t('cash.noMovements')} />}
    />
  );
}
