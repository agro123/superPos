import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import type { Money } from '@/shared/domain/money';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, updateAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import {
  cashShiftSchema,
  expenseSchema,
  shiftSaleSchema,
  type CashShift,
  type Expense,
  type ShiftSale,
} from '../domain/cashShift';

const db = () => getFirebase().db;
const converter = zodConverter(cashShiftSchema);
const expenseConverter = zodConverter(expenseSchema);
const shiftSaleConverter = zodConverter(shiftSaleSchema);
const shiftsCol = (bid: string) => collection(db(), 'businesses', bid, 'cashShifts');
const expensesCol = (bid: string, shiftId: string) =>
  collection(db(), 'businesses', bid, 'cashShifts', shiftId, 'expenses');

export function watchRecentShifts(bid: string): Subscribe<Synced<CashShift>[]> {
  return watchQuery(
    query(shiftsCol(bid), orderBy('openedAt', 'desc'), limit(30)).withConverter(converter),
  );
}

/** Ventas (y anulaciones) asociadas al turno. */
export function watchShiftSales(bid: string, shiftId: string): Subscribe<Synced<ShiftSale>[]> {
  return watchQuery(
    query(
      collection(db(), 'businesses', bid, 'sales'),
      where('cashShiftId', '==', shiftId),
    ).withConverter(shiftSaleConverter),
  );
}

export function watchExpenses(bid: string, shiftId: string): Subscribe<Synced<Expense>[]> {
  return watchQuery(query(expensesCol(bid, shiftId)).withConverter(expenseConverter));
}

/** Abre un turno con id generado en cliente (funciona sin conexión). */
export function openShift(
  bid: string,
  deviceCode: string,
  openingFloat: Money,
  uid: string,
): string {
  const ref = doc(shiftsCol(bid));
  trackWrite(
    setDoc(ref, {
      status: 'open',
      deviceCode,
      openedBy: uid,
      openedAt: serverTimestamp(),
      openingFloatMinor: openingFloat,
      closedBy: null,
      closedAt: null,
      countedCashMinor: null,
      expectedCashMinor: null,
      notes: null,
      ...createAudit(uid),
    }),
    'cashShifts.open',
  );
  return ref.id;
}

/** `open ↔ closing`: inicia o cancela el arqueo. */
export function setShiftClosing(bid: string, shiftId: string, closing: boolean): void {
  trackWrite(
    updateDoc(doc(shiftsCol(bid), shiftId), {
      status: closing ? 'closing' : 'open',
      ...updateAudit(),
    }),
    'cashShifts.closing',
  );
}

export interface CloseShiftData {
  countedCash: Money;
  expectedCash: Money;
  notes: string | null;
}

/** `closing → closed` con el arqueo. */
export function closeShift(bid: string, shiftId: string, data: CloseShiftData, uid: string): void {
  trackWrite(
    updateDoc(doc(shiftsCol(bid), shiftId), {
      status: 'closed',
      closedBy: uid,
      closedAt: serverTimestamp(),
      countedCashMinor: data.countedCash,
      expectedCashMinor: data.expectedCash,
      notes: data.notes,
      ...updateAudit(),
    }),
    'cashShifts.close',
  );
}

export function addExpense(
  bid: string,
  shiftId: string,
  input: { amountMinor: Money; description: string },
  uid: string,
): void {
  trackWrite(
    setDoc(doc(expensesCol(bid, shiftId)), { ...input, ...createAudit(uid) }),
    'cashShifts.expense',
  );
}
