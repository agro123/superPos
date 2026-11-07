import { Wallet } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { Can, usePermission } from '@/features/users';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, EmptyState, Modal, PageHeader, Skeleton, Text } from '@/shared/ui';
import {
  useCurrentShift,
  useRecentShifts,
  useShiftsActivity,
  useShiftSummary,
} from '../application/useCash';
import { useWorkerNames } from '../application/useWorkerNames';
import type { CashShift } from '../domain/cashShift';
import { shiftMovements } from '../domain/movements';
import { ShiftMovementsDialog } from '../ui/ShiftMovementsDialog';
import { addExpense, closeShift, openShift, setShiftClosing } from '../application/cashActions';
import { CurrentShiftPanel } from '../ui/CurrentShiftPanel';
import { ShiftHistory } from '../ui/ShiftHistory';
import { CloseShiftForm, ExpenseForm, OpenShiftForm } from '../ui/ShiftForms';
import { ShiftSummaryView } from '../ui/ShiftSummaryView';

type ModalId = 'open' | 'close' | 'expense' | null;

/** Caja: apertura con base, ventas del turno, gastos y cierre con arqueo (ADR 0009). */
export default function CashPage() {
  const { business, paymentMethods } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const online = useOnlineStatus();
  const shifts = useRecentShifts(business.id);
  const { shift, loading, deviceCode } = useCurrentShift(business.id);
  const live = useShiftSummary(business.id, shift);
  const [modal, setModal] = useState<ModalId>(null);
  const canSeeMovements = usePermission('reports.view');
  const workerName = useWorkerNames(business.id);
  const [viewing, setViewing] = useState<CashShift | null>(null);
  const viewed = useShiftsActivity(business.id, viewing ? [viewing] : []);
  const viewedActivity = viewed.activity[0];
  const saved = (title: string) => {
    toast({ title, description: online ? undefined : t('common.savedOffline'), tone: 'success' });
  };

  const startClose = () => {
    if (shift?.status === 'open') setShiftClosing(business.id, shift.id, true);
    setModal('close');
  };
  const cancelClose = () => {
    if (shift?.status === 'closing') setShiftClosing(business.id, shift.id, false);
    setModal(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('cash.title')}
        description={t('cash.description')}
        actions={<Badge>{t('cash.device', { code: deviceCode })}</Badge>}
      />
      {loading ? (
        <Skeleton className="h-40" />
      ) : shift ? (
        <CurrentShiftPanel
          shift={shift}
          timezone={business.timezone}
          currency={business.currency}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setModal('expense');
                }}
              >
                {t('cash.addExpense')}
              </Button>
              {canSeeMovements ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setViewing(shift);
                  }}
                >
                  {t('cash.movements')}
                </Button>
              ) : null}
              <Can permission="cash.close">
                <Button onClick={startClose}>
                  {shift.status === 'closing' ? t('cash.resumeClose') : t('cash.close')}
                </Button>
              </Can>
            </>
          }
        >
          {live.error ? (
            <div className="flex items-center gap-3">
              <Text variant="muted">{t('errors.unknown')}</Text>
              <Button variant="outline" onClick={live.refetch}>
                {t('common.retry')}
              </Button>
            </div>
          ) : live.summary ? (
            <ShiftSummaryView
              summary={live.summary}
              openingFloat={shift.openingFloatMinor}
              currency={business.currency}
              methods={paymentMethods}
            />
          ) : (
            <Skeleton className="h-32" />
          )}
        </CurrentShiftPanel>
      ) : (
        <EmptyState
          icon={<Wallet />}
          title={t('cash.closedState')}
          description={t('cash.closedHint')}
          action={
            <Button
              onClick={() => {
                setModal('open');
              }}
            >
              {t('cash.open')}
            </Button>
          }
        />
      )}
      <ShiftHistory
        shifts={shifts.data ?? []}
        loading={shifts.isPending}
        currency={business.currency}
        timezone={business.timezone}
        onSelect={canSeeMovements ? setViewing : undefined}
      />
      <ShiftMovementsDialog
        shift={viewing}
        movements={viewedActivity ? shiftMovements(viewedActivity) : []}
        loading={viewed.loading}
        currency={business.currency}
        timezone={business.timezone}
        workerName={workerName}
        onClose={() => {
          setViewing(null);
        }}
      />
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
        <OpenShiftForm
          currency={business.currency}
          onSubmit={({ openingFloatMinor }) => {
            openShift(business.id, deviceCode, openingFloatMinor, user.uid);
            saved(t('cash.opened'));
            setModal(null);
          }}
        />
      </Modal>
      <Modal
        open={modal === 'expense'}
        onOpenChange={(open) => {
          setModal(open ? 'expense' : null);
        }}
        title={t('cash.addExpense')}
        footer={
          <Button type="submit" form="expense-form">
            {t('common.save')}
          </Button>
        }
      >
        <ExpenseForm
          currency={business.currency}
          onSubmit={(values) => {
            if (shift) addExpense(business.id, shift.id, values, user.uid);
            saved(t('cash.expenseSaved'));
            setModal(null);
          }}
        />
      </Modal>
      <Modal
        open={modal === 'close' && shift !== null}
        onOpenChange={(open) => {
          if (!open) cancelClose();
        }}
        title={t('cash.closeTitle')}
        description={t('cash.closeDescription')}
        size="lg"
        footer={
          <Button type="submit" form="close-shift-form">
            {t('cash.close')}
          </Button>
        }
      >
        {shift && live.summary ? (
          <div className="flex flex-col gap-6">
            <ShiftSummaryView
              summary={live.summary}
              openingFloat={shift.openingFloatMinor}
              currency={business.currency}
              methods={paymentMethods}
            />
            <CloseShiftForm
              currency={business.currency}
              expected={live.summary.expectedCash}
              onSubmit={({ countedCashMinor, notes }) => {
                if (!live.summary) return;
                closeShift(
                  business.id,
                  shift.id,
                  { countedCash: countedCashMinor, expectedCash: live.summary.expectedCash, notes },
                  user.uid,
                );
                saved(t('cash.closed'));
                setModal(null);
              }}
            />
          </div>
        ) : (
          <Skeleton className="h-40" />
        )}
      </Modal>
    </div>
  );
}
