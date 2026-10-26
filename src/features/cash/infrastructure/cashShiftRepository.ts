import { collection, limit, orderBy, query } from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { cashShiftSchema, type CashShift } from '../domain/cashShift';

const converter = zodConverter(cashShiftSchema);

export function watchRecentShifts(bid: string): Subscribe<Synced<CashShift>[]> {
  const shifts = collection(getFirebase().db, 'businesses', bid, 'cashShifts').withConverter(
    converter,
  );
  return watchQuery(query(shifts, orderBy('openedAt', 'desc'), limit(30)));
}
