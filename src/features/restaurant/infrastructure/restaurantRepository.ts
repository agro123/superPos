import {
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, updateAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import { restaurantOrderSchema, type OrderLine, type RestaurantOrder } from '../domain/order';
import {
  tableSchema,
  zoneSchema,
  type Table,
  type TableStatus,
  type Zone,
} from '../domain/restaurant';

const db = () => getFirebase().db;
const col = (bid: string, name: string) => collection(db(), 'businesses', bid, name);
const zoneConverter = zodConverter(zoneSchema);
const tableConverter = zodConverter(tableSchema);
const orderConverter = zodConverter(restaurantOrderSchema);

export const watchZones = (bid: string): Subscribe<Synced<Zone>[]> =>
  watchQuery(query(col(bid, 'restaurantZones'), orderBy('sortOrder')).withConverter(zoneConverter));

export const watchTables = (bid: string): Subscribe<Synced<Table>[]> =>
  watchQuery(query(col(bid, 'restaurantTables'), orderBy('name')).withConverter(tableConverter));

/** Comandas activas (abiertas, en cocina o servidas): el tablero y la cocina. */
export const watchActiveOrders = (bid: string): Subscribe<Synced<RestaurantOrder>[]> =>
  watchQuery(
    query(
      col(bid, 'restaurantOrders'),
      where('status', 'in', ['open', 'sent', 'served']),
    ).withConverter(orderConverter),
  );

export function createZone(bid: string, name: string, sortOrder: number, uid: string): void {
  trackWrite(
    setDoc(doc(col(bid, 'restaurantZones')), { name, sortOrder, ...createAudit(uid) }),
    'restaurant.zone',
  );
}

export function createTable(
  bid: string,
  data: { name: string; zoneId: string; seats: number },
  uid: string,
): void {
  trackWrite(
    setDoc(doc(col(bid, 'restaurantTables')), { ...data, status: 'free', ...createAudit(uid) }),
    'restaurant.table',
  );
}

export function deleteTable(bid: string, tableId: string): void {
  trackWrite(deleteDoc(doc(col(bid, 'restaurantTables'), tableId)), 'restaurant.tableDelete');
}

export function setTableStatus(bid: string, tableId: string, status: TableStatus): void {
  trackWrite(
    updateDoc(doc(col(bid, 'restaurantTables'), tableId), { status, ...updateAudit() }),
    'restaurant.tableStatus',
  );
}

/** Abre la comanda y ocupa la mesa en un batch. Devuelve el id (generado en cliente). */
export function openOrder(
  bid: string,
  table: Pick<Table, 'id' | 'name'>,
  guests: number,
  uid: string,
): string {
  const ref = doc(col(bid, 'restaurantOrders'));
  const batch = writeBatch(db());
  batch.set(ref, {
    tableId: table.id,
    tableName: table.name,
    status: 'open',
    guests,
    lines: [],
    round: 0,
    notes: null,
    saleId: null,
    openedAt: serverTimestamp(),
    sentAt: null,
    servedAt: null,
    closedAt: null,
    ...createAudit(uid),
  });
  batch.update(doc(col(bid, 'restaurantTables'), table.id), {
    status: 'occupied',
    ...updateAudit(),
  });
  trackWrite(batch.commit(), 'restaurant.open');
  return ref.id;
}

export function saveOrderLines(bid: string, orderId: string, lines: readonly OrderLine[]): void {
  trackWrite(
    updateDoc(doc(col(bid, 'restaurantOrders'), orderId), { lines, ...updateAudit() }),
    'restaurant.lines',
  );
}

/** Nueva ronda a cocina (la comanda pasa a "en cocina"). */
export function sendOrderRound(
  bid: string,
  orderId: string,
  lines: readonly OrderLine[],
  round: number,
): void {
  trackWrite(
    updateDoc(doc(col(bid, 'restaurantOrders'), orderId), {
      lines,
      round,
      status: 'sent',
      sentAt: serverTimestamp(),
      ...updateAudit(),
    }),
    'restaurant.send',
  );
}

export function markOrderServed(bid: string, orderId: string): void {
  trackWrite(
    updateDoc(doc(col(bid, 'restaurantOrders'), orderId), {
      status: 'served',
      servedAt: serverTimestamp(),
      ...updateAudit(),
    }),
    'restaurant.served',
  );
}

/** Cierra la comanda (cobrada con su venta, o cancelada) y libera la mesa en un batch. */
export function closeOrder(
  bid: string,
  order: { id: string; tableId: string },
  result: { status: 'paid'; saleId: string } | { status: 'cancelled' },
): void {
  const batch = writeBatch(db());
  batch.update(doc(col(bid, 'restaurantOrders'), order.id), {
    status: result.status,
    ...(result.status === 'paid' ? { saleId: result.saleId } : {}),
    closedAt: serverTimestamp(),
    ...updateAudit(),
  });
  batch.update(doc(col(bid, 'restaurantTables'), order.tableId), {
    status: 'free',
    ...updateAudit(),
  });
  trackWrite(batch.commit(), `restaurant.${result.status}`);
}
