import { useMemo } from 'react';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { getPlatform } from '@/shared/infrastructure/platform';
import { currentShiftFor, summarizeShift, type CashShift } from '../domain/cashShift';
import {
  watchExpenses,
  watchRecentShifts,
  watchShiftSales,
} from '../infrastructure/cashShiftRepository';

export const useRecentShifts = (bid: string) =>
  useLiveQuery(['cashShifts', bid], watchRecentShifts(bid));

/** Código de este dispositivo/caja (PlatformAdapter). */
export function useDeviceCode(): string {
  return useMemo(() => getPlatform().deviceCode(), []);
}

/** Turno abierto (o en arqueo) de este dispositivo. `loading` mientras se lee. */
export function useCurrentShift(bid: string) {
  const deviceCode = useDeviceCode();
  const shifts = useRecentShifts(bid);
  const shift = useMemo(
    () => currentShiftFor(shifts.data ?? [], deviceCode),
    [shifts.data, deviceCode],
  );
  return { shift, loading: shifts.isPending, error: shifts.error, deviceCode };
}

/** Resumen en vivo del turno: ingresos por método, vueltos, gastos y efectivo esperado. */
export function useShiftSummary(bid: string, shift: CashShift | null) {
  const shiftId = shift?.id ?? null;
  const sales = useLiveQuery(
    ['shiftSales', bid, shiftId],
    shiftId ? watchShiftSales(bid, shiftId) : null,
  );
  const expenses = useLiveQuery(
    ['shiftExpenses', bid, shiftId],
    shiftId ? watchExpenses(bid, shiftId) : null,
  );
  const summary = useMemo(
    () =>
      shift
        ? summarizeShift(
            shift.openingFloatMinor,
            sales.data ?? [],
            (expenses.data ?? []).map((e) => e.amountMinor),
          )
        : null,
    [shift, sales.data, expenses.data],
  );
  return {
    summary,
    expenses: expenses.data ?? [],
    loading: sales.isPending || expenses.isPending,
    error: sales.error ?? expenses.error,
    refetch: () => {
      void sales.refetch();
      void expenses.refetch();
    },
  };
}
