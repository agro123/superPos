import { useMemo, useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { summarizeShift, type CashShift } from '../domain/cashShift';
import { shiftMovements } from '../domain/movements';
import { shiftReportText } from './shiftReport';
import { useShiftsActivity } from './useCash';
import { useWorkerNames } from './useWorkerNames';

/** Turno seleccionado para ver sus movimientos y enviar su resumen. */
export function useShiftDetail() {
  const { business } = useActiveBusiness();
  const [viewing, setViewing] = useState<CashShift | null>(null);
  const shifts = useMemo(() => (viewing ? [viewing] : []), [viewing]);
  const live = useShiftsActivity(business.id, shifts);
  const workerName = useWorkerNames(business.id);
  const activity = live.activity[0];
  const report =
    viewing && activity && !live.loading
      ? shiftReportText(
          viewing,
          summarizeShift(
            viewing.openingFloatMinor,
            activity.sales,
            activity.expenses.map((e) => e.amountMinor),
            activity.creditPayments,
          ),
          workerName,
          business.currency,
          business.timezone,
        )
      : null;
  return {
    viewing,
    setViewing,
    movements: activity ? shiftMovements(activity) : [],
    loading: live.loading,
    report,
    workerName,
  };
}
