import { Wallet } from 'lucide-react';
import type { Synced } from '@/shared/domain/live';
import { subtractMoney, type CurrencyCode, type Money } from '@/shared/domain/money';
import { formatDateTime, formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, DataTable, EmptyState, type DataTableColumn } from '@/shared/ui';
import type { CashShift } from '../domain/cashShift';

export interface ShiftHistoryProps {
  shifts: readonly Synced<CashShift>[];
  loading: boolean;
  currency: CurrencyCode;
  timezone: string;
  /** Abre los movimientos del turno (solo para quien puede verlos). */
  onSelect?: (shift: CashShift) => void;
}

/** Historial de turnos con el arqueo de cada uno. */
export function ShiftHistory({ shifts, loading, currency, timezone, onSelect }: ShiftHistoryProps) {
  const money = (amount: Money | null) => (amount === null ? '—' : formatMoney(amount, currency));
  const columns: DataTableColumn<Synced<CashShift>>[] = [
    {
      id: 'opened',
      header: t('cash.col.opened'),
      cell: (s) => formatDateTime(s.openedAt, timezone),
      sortValue: (s) => s.openedAt.getTime(),
    },
    {
      id: 'closed',
      header: t('cash.col.closed'),
      hideOnMobile: true,
      cell: (s) => (s.closedAt ? formatDateTime(s.closedAt, timezone) : '—'),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (s) => (
        <Badge tone={s.status === 'closed' ? 'neutral' : 'success'}>
          {t(`cash.status.${s.status}`)}
        </Badge>
      ),
    },
    {
      id: 'expected',
      header: t('cash.col.expected'),
      align: 'right',
      hideOnMobile: true,
      cell: (s) => money(s.expectedCashMinor),
    },
    {
      id: 'counted',
      header: t('cash.col.counted'),
      align: 'right',
      cell: (s) => money(s.countedCashMinor),
    },
    {
      id: 'difference',
      header: t('cash.col.difference'),
      align: 'right',
      cell: (s) =>
        s.countedCashMinor !== null && s.expectedCashMinor !== null
          ? money(subtractMoney(s.countedCashMinor, s.expectedCashMinor))
          : '—',
    },
  ];
  return (
    <section aria-labelledby="shift-history" className="flex flex-col gap-3">
      <h2 id="shift-history" className="text-lg font-semibold text-text">
        {t('cash.history')}
      </h2>
      <DataTable
        caption={t('cash.historyTable')}
        columns={columns}
        rows={shifts}
        getRowId={(s) => s.id}
        loading={loading}
        onRowClick={onSelect}
        emptyState={<EmptyState icon={<Wallet />} title={t('cash.noHistory')} />}
      />
    </section>
  );
}
