import type { CurrencyCode } from '@/shared/domain/money';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState } from '@/shared/ui';
import { useCashPeriod } from '../application/useCashPeriod';
import { WorkerCashTable } from './WorkerCashTable';

export interface CashByWorkerReportProps {
  businessId: string;
  currency: CurrencyCode;
  /** Periodo: turnos abiertos en los últimos `days` días. */
  days: number;
}

/** Reporte de caja por trabajador (turnos del periodo, en tiempo real). */
export function CashByWorkerReport({ businessId, currency, days }: CashByWorkerReportProps) {
  const { shifts, list, activity, rows, workerName } = useCashPeriod(businessId, days);
  const error = shifts.error ?? activity.error;

  return (
    <section aria-labelledby="cash-by-worker" className="flex flex-col gap-3">
      <div>
        <h2 id="cash-by-worker" className="text-lg font-semibold text-text">
          {t('cash.report.title')}
        </h2>
        <p className="text-sm text-text-muted">{t('cash.report.description')}</p>
      </div>
      {error ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(error)}
          action={
            <Button
              onClick={() => {
                void shifts.refetch();
                activity.refetch();
              }}
            >
              {t('common.retry')}
            </Button>
          }
        />
      ) : list.length === 0 && !shifts.isPending ? (
        <EmptyState title={t('cash.report.empty')} />
      ) : (
        <WorkerCashTable
          caption={t('cash.report.table')}
          rows={rows}
          loading={shifts.isPending || activity.loading}
          currency={currency}
          workerName={workerName}
        />
      )}
    </section>
  );
}
