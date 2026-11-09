import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { as, BID, createEnv, EMPLOYEE, newAudit, OUTSIDER, seed } from './env';

let env: RulesTestEnvironment;
const path = (p: string) => `businesses/${BID}/${p}`;

beforeAll(async () => {
  env = await createEnv();
});
beforeEach(async () => {
  await seed(env);
});
afterAll(async () => {
  await env.cleanup();
});

const line = {
  id: 'l1',
  productId: 'p1',
  name: 'Café',
  unitPriceMinor: 350000,
  taxRateBps: 0,
  quantity: 1,
  notes: null,
  round: 0,
};
const order = (overrides: Record<string, unknown> = {}) => ({
  tableId: 't1',
  tableName: 'Mesa 1',
  status: 'open',
  guests: 2,
  lines: [line],
  round: 0,
  notes: null,
  saleId: null,
  openedAt: serverTimestamp(),
  sentAt: null,
  servedAt: null,
  closedAt: null,
  ...overrides,
});
const open = (db: Firestore) =>
  setDoc(doc(db, path('restaurantOrders/o1')), { ...order(), ...newAudit(EMPLOYEE) });
const move = (db: Firestore, data: Record<string, unknown>) =>
  updateDoc(doc(db, path('restaurantOrders/o1')), { ...data, updatedAt: serverTimestamp() });

describe('comandas (restaurantOrders)', () => {
  it('quien vende abre una comanda de una mesa existente; un extraño no la lee', async () => {
    const db = as(env, EMPLOYEE);
    await assertFails(
      setDoc(doc(db, path('restaurantOrders/x')), {
        ...order({ tableId: 'no-existe' }),
        ...newAudit(EMPLOYEE),
      }),
    );
    await assertFails(
      setDoc(doc(db, path('restaurantOrders/x')), {
        ...order({ status: 'paid' }),
        ...newAudit(EMPLOYEE),
      }),
    );
    await assertSucceeds(open(db));
    await assertSucceeds(getDoc(doc(db, path('restaurantOrders/o1'))));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('restaurantOrders/o1'))));
  });

  it('respeta la máquina de estados y la ronda no retrocede', async () => {
    const db = as(env, EMPLOYEE);
    await open(db);
    await assertFails(move(db, { status: 'served' })); // abierta → servida: no
    await assertSucceeds(move(db, { status: 'sent', round: 1, sentAt: serverTimestamp() }));
    await assertFails(move(db, { round: 0 }));
    await assertSucceeds(move(db, { status: 'served', servedAt: serverTimestamp() }));
    await assertFails(move(db, { status: 'cancelled', closedAt: serverTimestamp() })); // servida: no se cancela
  });

  it('cobrar exige una venta existente; cerrada ya no cambia', async () => {
    const db = as(env, EMPLOYEE);
    await open(db);
    await assertFails(
      move(db, { status: 'paid', saleId: 'no-existe', closedAt: serverTimestamp() }),
    );
    await assertFails(move(db, { status: 'paid', saleId: 's1' })); // sin closedAt del servidor
    await assertSucceeds(move(db, { status: 'paid', saleId: 's1', closedAt: serverTimestamp() }));
    await assertFails(move(db, { notes: 'otra cosa' }));
  });
});
