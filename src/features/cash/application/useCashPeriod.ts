import { useMemo } from 'react';
import { cashByWorker, shiftMovements } from '../domain/movements';
import { useShiftsActivity, useShiftsSince } from './useCash';
import { useWorkerNames } from './useWorkerNames';

/** Turnos del periodo con su actividad: caja por trabajador y gastos (reportes y exportación). */
export function useCashPeriod(businessId: string, days: number) {
  const shifts = useShiftsSince(businessId, days);
  const list = useMemo(() => shifts.data ?? [], [shifts.data]);
  const activity = useShiftsActivity(businessId, list);
  const workerName = useWorkerNames(businessId);
  const rows = useMemo(
    () => cashByWorker(activity.activity.flatMap((item) => shiftMovements(item))),
    [activity.activity],
  );
  const expenses = useMemo(
    () => activity.activity.flatMap((item) => item.expenses.map((e) => e.amountMinor)),
    [activity.activity],
  );
  return {
    shifts,
    list,
    activity,
    rows,
    expenses,
    workerName,
    loading: shifts.isPending || activity.loading,
  };
}
