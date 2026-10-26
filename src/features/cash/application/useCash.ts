import { useMemo } from 'react';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { getPlatform } from '@/shared/infrastructure/platform';
import { watchRecentShifts } from '../infrastructure/cashShiftRepository';

export const useRecentShifts = (bid: string) =>
  useLiveQuery(['cashShifts', bid], watchRecentShifts(bid));

/** Código de este dispositivo/caja (PlatformAdapter). */
export function useDeviceCode(): string {
  return useMemo(() => getPlatform().deviceCode(), []);
}
