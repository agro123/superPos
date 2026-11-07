import { useState } from 'react';
import { money as toMoney, type CurrencyCode } from '@/shared/domain/money';
import { TENDER_METHODS } from '@/shared/domain/payment';
import { formatDateTime, formatMoney, formatTime } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, DataTable, Modal, Select, type DataTableColumn } from '@/shared/ui';
import { cashByWorker, type CashMovement } from '../domain/movements';
import type { CashShift } from '../domain/cashShift';
import { WorkerCashTable } from './WorkerCashTable';

const OTHER_METHODS = TENDER_METHODS.filter((method) => method !== 'cash');

export interface ShiftMovementsDialogProps {
  shift: CashShift | null;
  movements: readonly CashMovement[];
  loading: boolean;
  currency: CurrencyCode;
  timezone: string;
  workerName: (uid: string) => string;
  onClose: () => void;
}

/** Quién hizo qué en el turno: línea de tiempo filtrable por trabajador y totales por persona. */
export function ShiftMovementsDialog({
  shift,
  movements,
  loading,
  currency,
  timezone,
  workerName,
  onClose,
}: ShiftMovementsDialogProps) {
  const [worker, setWorker] = useState('all');
  const workers = [...new Set(movements.map((m) => m.by))];
  const visible = worker === 'all' ? movements : movements.filter((m) => m.by === worker);
  const money = (value: CashMovement['cashIn']) => (value > 0 ? formatMoney(value, currency) : '—');
  const columns: DataTableColumn<CashMovement>[] = [
    { id: 'time', header: t('cash.col.time'), cell: (m) => formatTime(m.at, timezone) },
    { id: 'worker', header: t('cash.col.worker'), cell: (m) => workerName(m.by) },
    {
      id: 'movement',
      header: t('cash.col.movement'),
      cell: (m) => (
        <span className="flex flex-wrap items-center gap-1">
          {t(`cash.kind.${m.kind}`, { ref: m.reference ?? '' })}
          {m.voided ? <Badge tone="danger">{t('cash.voidedSale')}</Badge> : null}
        </span>
      ),
    },
    { id: 'in', header: t('cash.col.cashIn'), align: 'right', cell: (m) => money(m.cashIn) },
    { id: 'out', header: t('cash.col.cashOut'), align: 'right', cell: (m) => money(m.cashOut) },
    {
      id: 'other',
      header: t('cash.col.other'),
      align: 'right',
      hideOnMobile: true,
      cell: (m) => {
        if (m.difference !== null) {
          const sign = m.difference < 0 ? '−' : m.difference > 0 ? '+' : '';
          return `${t('cash.col.difference')}: ${sign} ${formatMoney(toMoney(Math.abs(m.difference)), currency)}`;
        }
        const other = OTHER_METHODS.flatMap((method) => {
          const amount = m.methods[method];
          return amount ? [`${t(`payment.${method}`)} ${formatMoney(amount, currency)}`] : [];
        });
        return other.length > 0 ? other.join(' · ') : '—';
      },
    },
  ];

  return (
    <Modal
      open={shift !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="lg"
      title={
        shift ? t('cash.movementsTitle', { date: formatDateTime(shift.openedAt, timezone) }) : ''
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          aria-label={t('cash.filterWorker')}
          className="sm:w-56"
          value={worker}
          onValueChange={setWorker}
          options={[
            { value: 'all', label: t('cash.allWorkers') },
            ...workers.map((uid) => ({ value: uid, label: workerName(uid) })),
          ]}
        />
        <DataTable
          caption={t('cash.movementsTable')}
          columns={columns}
          rows={visible}
          getRowId={(m) => m.id}
          loading={loading}
        />
        <h3 className="text-base font-semibold text-text">{t('cash.byWorkerTitle')}</h3>
        <WorkerCashTable
          caption={t('cash.byWorkerTitle')}
          rows={cashByWorker(movements)}
          loading={loading}
          currency={currency}
          workerName={workerName}
        />
      </div>
    </Modal>
  );
}
