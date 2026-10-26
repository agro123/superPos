import {
  collection,
  doc,
  increment,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { createAudit } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import type { SaleWriter } from '../domain/ports';

/** Venta + descuento de stock (`increment`) + movimientos de inventario en un solo `writeBatch` (L1). */
export const saleWriter: SaleWriter = {
  newId(businessId) {
    return doc(collection(getFirebase().db, 'businesses', businessId, 'sales')).id;
  },
  record(businessId, sale, stock, uid) {
    const db = getFirebase().db;
    const business = (...path: string[]) => doc(db, 'businesses', businessId, ...path);
    const batch = writeBatch(db);
    const { id, occurredAt, ...fields } = sale;
    batch.set(business('sales', id), {
      ...fields,
      occurredAt: Timestamp.fromDate(occurredAt),
      ...createAudit(uid),
    });
    for (const { productId, quantity } of stock) {
      batch.update(business('products', productId), {
        stock: increment(-quantity),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(collection(db, 'businesses', businessId, 'inventoryMovements')), {
        productId,
        type: 'sale',
        quantityDelta: -quantity,
        reason: null,
        saleId: id,
        ...createAudit(uid),
      });
    }
    trackWrite(batch.commit(), 'sales.record');
  },
};
