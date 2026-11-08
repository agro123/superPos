import {
  collection,
  doc,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, updateAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import {
  inventoryMovementSchema,
  supplierSchema,
  type InventoryMovement,
  type Supplier,
} from '../domain/stock';
import type { StockChangeMode } from '../domain/stockChange';

const db = () => getFirebase().db;
const movementConverter = zodConverter(inventoryMovementSchema);
const supplierConverter = zodConverter(supplierSchema);
const movementsCol = (bid: string) => collection(db(), 'businesses', bid, 'inventoryMovements');
const suppliersCol = (bid: string) => collection(db(), 'businesses', bid, 'suppliers');

export const watchMovements = (bid: string): Subscribe<Synced<InventoryMovement>[]> =>
  watchQuery(
    query(movementsCol(bid), orderBy('createdAt', 'desc'), limit(200)).withConverter(
      movementConverter,
    ),
  );

/** Movimientos desde una fecha (reporte de ganancia: merma). */
export const watchMovementsSince = (
  bid: string,
  since: Date,
): Subscribe<Synced<InventoryMovement>[]> =>
  watchQuery(
    query(
      movementsCol(bid),
      where('createdAt', '>=', Timestamp.fromDate(since)),
      orderBy('createdAt', 'desc'),
      limit(2000),
    ).withConverter(movementConverter),
  );

export const watchSuppliers = (bid: string): Subscribe<Synced<Supplier>[]> =>
  watchQuery(query(suppliersCol(bid), orderBy('name')).withConverter(supplierConverter));

export interface StockChange {
  productId: string;
  mode: StockChangeMode;
  delta: number;
  reason: string | null;
  supplierId: string | null;
}

/** Stock (`increment`) y bitácora en un solo `writeBatch` (L1); funciona sin conexión. */
export function recordStockChange(bid: string, change: StockChange, uid: string): void {
  const batch = writeBatch(db());
  batch.update(doc(db(), 'businesses', bid, 'products', change.productId), {
    stock: increment(change.delta),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(movementsCol(bid)), {
    productId: change.productId,
    type: change.mode,
    quantityDelta: change.delta,
    reason: change.reason,
    saleId: null,
    supplierId: change.mode === 'purchase' ? change.supplierId : null,
    ...createAudit(uid),
  });
  trackWrite(batch.commit(), `inventory.${change.mode}`);
}

type SupplierFields = Pick<Supplier, 'name' | 'phone' | 'email'>;

export function saveSupplier(
  bid: string,
  id: string | null,
  fields: SupplierFields,
  uid: string,
): void {
  if (id) {
    trackWrite(
      updateDoc(doc(suppliersCol(bid), id), { ...fields, ...updateAudit() }),
      'suppliers.update',
    );
  } else {
    trackWrite(
      setDoc(doc(suppliersCol(bid)), { ...fields, ...createAudit(uid) }),
      'suppliers.create',
    );
  }
}
