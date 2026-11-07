import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
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
  shiftCreditPaymentSchema,
  shiftSaleSchema,
  type CashShift,
  type Expense,
  type ShiftCreditPayment,
  type ShiftSale,
} from '../domain/cashShift';

const db = () => getFirebase().db;
const converter = zodConverter(cashShiftSchema);
const expenseConverter = zodConverter(expenseSchema);
const shiftSaleConverter = zodConverter(shiftSaleSchema);
const creditPaymentConverter = zodConverter(shiftCreditPaymentSchema);
const shiftsCol = (bid: string) => collection(db(), 'businesses', bid, 'cashShifts');
const expensesCol = (bid: string, shiftId: string) =>
  collection(db(), 'businesses', bid, 'cashShifts', shiftId, 'expenses');

export function watchRecentShifts(bid: string): Subscribe<Synced<CashShift>[]> {
  return watchQuery(
    query(shiftsCol(bid), orderBy('openedAt', 'desc'), limit(30)).withConverter(converter),
  );
}

/** Une varias suscripciones de listas en una sola (emite cuando todas entregaron su primer valor). */
function mergeLists<T>(subscriptions: readonly Subscribe<Synced<T>[]>[]): Subscribe<Synced<T>[]> {
  return (onNext, onError) => {
    if (subscriptions.length === 0) {
      onNext([]);
      return () => undefined;
    }
    const latest: (Synced<T>[] | undefined)[] = subscriptions.map(() => undefined);
    const stops = subscriptions.map((subscribe, index) =>
      subscribe((value) => {
        latest[index] = value;
        if (latest.every((item) => item !== undefined)) onNext(latest.flat());
      }, onError),
    );
    return () => {
      for (const stop of stops) stop();
    };
  };
}

/** `in` admite hasta 30 valores por consulta. */
const chunks = (ids: readonly string[]) =>
  Array.from({ length: Math.ceil(ids.length / 30) }, (_, i) => ids.slice(i * 30, i * 30 + 30));

/** Turnos abiertos desde una fecha (reporte de caja por trabajador). */
export function watchShiftsSince(bid: string, since: Date): Subscribe<Synced<CashShift>[]> {
  return watchQuery(
    query(
      shiftsCol(bid),
      where('openedAt', '>=', Timestamp.fromDate(since)),
      orderBy('openedAt', 'desc'),
      limit(200),
    ).withConverter(converter),
  );
}

export const watchSalesForShifts = (bid: string, ids: readonly string[]) =>
  mergeLists(
    chunks(ids).map((part) =>
      watchQuery(
        query(
          collection(db(), 'businesses', bid, 'sales'),
          where('cashShiftId', 'in', part),
        ).withConverter(shiftSaleConverter),
      ),
    ),
  );

/** Gastos de varios turnos; cada uno lleva el `shiftId` de su subcolección. */
export const watchExpensesForShifts = (
  bid: string,
  ids: readonly string[],
): Subscribe<Synced<Expense & { shiftId: string }>[]> =>
  mergeLists(
    ids.map(
      (id): Subscribe<Synced<Expense & { shiftId: string }>[]> =>
        (onNext, onError) =>
          watchExpenses(bid, id)((rows) => {
            onNext(rows.map((row) => ({ ...row, shiftId: id })));
          }, onError),
    ),
  );

/** Abonos a fiado recibidos en los turnos (solo con el módulo de clientes activo). */
export const watchCreditPaymentsForShifts = (
  bid: string,
  ids: readonly string[],
): Subscribe<Synced<ShiftCreditPayment>[]> =>
  mergeLists(
    chunks(ids).map((part) =>
      watchQuery(
        query(
          collection(db(), 'businesses', bid, 'creditPayments'),
          where('cashShiftId', 'in', part),
        ).withConverter(creditPaymentConverter),
      ),
    ),
  );

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
