import { useMemo } from 'react';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { getPlatform } from '@/shared/infrastructure/platform';
import { useActiveBusiness } from '@/features/business';
import { currentShiftFor, summarizeShift, type CashShift } from '../domain/cashShift';
import type { ShiftActivity } from '../domain/movements';
import {
  watchCreditPaymentsForShifts,
  watchExpensesForShifts,
  watchRecentShifts,
  watchSalesForShifts,
  watchShiftsSince,
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

/** Ventas, gastos y abonos de varios turnos, en tiempo real. */
export function useShiftsActivity(bid: string, shifts: readonly CashShift[]) {
  const { modules } = useActiveBusiness();
  const ids = shifts.map((shift) => shift.id);
  const key = ids.join(',');
  const enabled = ids.length > 0;
  const sales = useLiveQuery(
    ['shiftSales', bid, key],
    enabled ? watchSalesForShifts(bid, ids) : null,
  );
  const expenses = useLiveQuery(
    ['shiftExpenses', bid, key],
    enabled ? watchExpensesForShifts(bid, ids) : null,
  );
  // Los abonos solo existen (y solo se pueden leer) con el módulo de clientes activo.
  const credit = useLiveQuery(
    ['shiftCreditPayments', bid, key],
    enabled && modules.customers ? watchCreditPaymentsForShifts(bid, ids) : null,
  );
  const activity = useMemo<ShiftActivity[]>(
    () =>
      shifts.map((shift) => ({
        shift,
        sales: (sales.data ?? []).filter((s) => s.cashShiftId === shift.id),
        expenses: (expenses.data ?? []).filter((e) => e.shiftId === shift.id),
        creditPayments: (credit.data ?? []).filter((p) => p.cashShiftId === shift.id),
      })),
    [shifts, sales.data, expenses.data, credit.data],
  );
  return {
    activity,
    loading:
      enabled && (sales.isPending || expenses.isPending || (modules.customers && credit.isPending)),
    error: sales.error ?? expenses.error ?? credit.error,
    refetch: () => {
      void sales.refetch();
      void expenses.refetch();
      void credit.refetch();
    },
  };
}

/** Resumen en vivo del turno: ingresos por método, vueltos, gastos, abonos y efectivo esperado. */
export function useShiftSummary(bid: string, shift: CashShift | null) {
  const shifts = useMemo(() => (shift ? [shift] : []), [shift]);
  const live = useShiftsActivity(bid, shifts);
  const current = live.activity[0];
  const summary = useMemo(
    () =>
      shift && current
        ? summarizeShift(
            shift.openingFloatMinor,
            current.sales,
            current.expenses.map((e) => e.amountMinor),
            current.creditPayments,
          )
        : null,
    [shift, current],
  );
  return {
    summary,
    activity: current ?? null,
    loading: live.loading,
    error: live.error,
    refetch: live.refetch,
  };
}

/** Turnos de los últimos `days` días (para el reporte de caja por trabajador). */
export function useShiftsSince(bid: string, days: number) {
  const since = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
  }, [days]);
  return useLiveQuery(['shiftsSince', bid, since.toISOString()], watchShiftsSince(bid, since));
}
