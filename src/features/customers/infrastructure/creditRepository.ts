import { collection, doc, limit, query, setDoc, Timestamp, where } from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import type { Money } from '@/shared/domain/money';
import type { PaymentMethod } from '@/shared/domain/payment';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import {
  creditPaymentSchema,
  creditSaleSchema,
  type CreditPayment,
  type CreditSale,
} from '../domain/credit';

const db = () => getFirebase().db;
const saleConverter = zodConverter(creditSaleSchema);
const paymentConverter = zodConverter(creditPaymentSchema);
/** Tope de documentos de la cartera en esta fase (agregados en servidor: Cloud Functions). */
const MAX_LEDGER = 2000;

/** Ventas (y anulaciones) con fiado. */
export const watchCreditSales = (bid: string): Subscribe<Synced<CreditSale>[]> =>
  watchQuery(
    query(
      collection(db(), 'businesses', bid, 'sales'),
      where('creditMinor', '>', 0),
      limit(MAX_LEDGER),
    ).withConverter(saleConverter),
  );

export const watchCreditPayments = (bid: string): Subscribe<Synced<CreditPayment>[]> =>
  watchQuery(
    query(collection(db(), 'businesses', bid, 'creditPayments'), limit(MAX_LEDGER)).withConverter(
      paymentConverter,
    ),
  );

export interface CreditPaymentData {
  customerId: string;
  amountMinor: Money;
  method: PaymentMethod;
  cashShiftId: string;
}

/** Abono (offline-first): queda en la caja abierta de quien lo recibe. */
export function recordCreditPayment(bid: string, data: CreditPaymentData, uid: string): void {
  trackWrite(
    setDoc(doc(collection(db(), 'businesses', bid, 'creditPayments')), {
      ...data,
      occurredAt: Timestamp.now(),
      ...createAudit(uid),
    }),
    'creditPayments.create',
  );
}
