import { Wallet } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { Can } from '@/features/users';
import type { Synced } from '@/shared/domain/live';
import { subtractMoney, type Money } from '@/shared/domain/money';
import { useToast } from '@/shared/hooks/useToast';
import { formatDateTime, formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Modal,
  PageHeader,
  Skeleton,
  Text,
  type DataTableColumn,
} from '@/shared/ui';
import { useDeviceCode, useRecentShifts } from '../application/useCash';
import type { CashShift } from '../domain/cashShift';
import { CloseShiftForm, OpenShiftForm } from '../ui/ShiftForms';

/** Caja: estado del turno y modales de apertura/cierre (sin lógica en esta fase). */
export default function CashPage() {
  const { business } = useActiveBusiness();
  const deviceCode = useDeviceCode();
  const shifts = useRecentShifts(business.id);
  const toast = useToast();
  const [modal, setModal] = useState<'open' | 'close' | null>(null);
  const current = shifts.data?.find((shift) => shift.status !== 'closed') ?? null;
  const money = (amount: Money | null) =>
    amount === null ? '—' : formatMoney(amount, business.currency);
  const pending = () => {
    toast({
      title: t('common.comingNextPhase'),
      description: t('common.comingNextPhaseHint'),
      tone: 'info',
    });
    setModal(null);
  };

  const columns: DataTableColumn<Synced<CashShift>>[] = [
    {
      id: 'opened',
      header: t('cash.col.opened'),
      cell: (s) => formatDateTime(s.openedAt, business.timezone),
      sortValue: (s) => s.openedAt.getTime(),
    },
    {
      id: 'closed',
      header: t('cash.col.closed'),
      hideOnMobile: true,
      cell: (s) => (s.closedAt ? formatDateTime(s.closedAt, business.timezone) : '—'),
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
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('cash.title')}
        description={t('cash.description')}
        actions={<Badge>{t('cash.device', { code: deviceCode })}</Badge>}
      />
      <section
        aria-labelledby="current-shift"
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <h2 id="current-shift" className="sr-only">
          {t('cash.current')}
        </h2>
        {shifts.isPending ? (
          <Skeleton className="h-12 w-64" />
        ) : (
          <div>
            <Text variant="strong">
              {current
                ? t('cash.openState', { time: formatDateTime(current.openedAt, business.timezone) })
                : t('cash.closedState')}
            </Text>
            <Text variant="muted">
              {current
                ? t('cash.openingFloat') + ': ' + money(current.openingFloatMinor)
                : t('cash.closedHint')}
            </Text>
          </div>
        )}
        {current ? (
          <Can permission="cash.close">
            <Button
              variant="outline"
              onClick={() => {
                setModal('close');
              }}
            >
              {t('cash.close')}
            </Button>
          </Can>
        ) : (
          <Button
            onClick={() => {
              setModal('open');
            }}
          >
            {t('cash.open')}
          </Button>
        )}
      </section>
      <section aria-label={t('cash.history')} className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text">{t('cash.history')}</h2>
        <DataTable
          caption={t('cash.historyTable')}
          columns={columns}
          rows={shifts.data ?? []}
          getRowId={(s) => s.id}
          loading={shifts.isPending}
          emptyState={<EmptyState icon={<Wallet />} title={t('cash.noHistory')} />}
        />
      </section>
      <Modal
        open={modal === 'open'}
        onOpenChange={(open) => {
          setModal(open ? 'open' : null);
        }}
        title={t('cash.openTitle')}
        description={t('cash.openDescription')}
        footer={
          <Button type="submit" form="open-shift-form">
            {t('cash.open')}
          </Button>
        }
      >
        <OpenShiftForm currency={business.currency} onSubmit={pending} />
      </Modal>
      <Modal
        open={modal === 'close'}
        onOpenChange={(open) => {
          setModal(open ? 'close' : null);
        }}
        title={t('cash.closeTitle')}
        description={t('cash.closeDescription')}
        footer={
          <Button type="submit" form="close-shift-form">
            {t('cash.close')}
          </Button>
        }
      >
        <CloseShiftForm currency={business.currency} onSubmit={pending} />
      </Modal>
    </div>
  );
}
