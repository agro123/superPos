import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  as,
  BID,
  CASHIER_PLUS,
  createEnv,
  EMPLOYEE,
  newAudit,
  OUTSIDER,
  OWNER,
  saleData,
  seed,
  shiftData,
} from './env';

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

describe('sales', () => {
  const create = (uid: string, data = saleData()) =>
    setDoc(doc(as(env, uid), path('sales/new')), { ...data, ...newAudit(uid) });

  it('sales.create registra; no miembro no', async () => {
    await assertSucceeds(create(EMPLOYEE));
    await assertFails(create(OUTSIDER));
  });

  it('sales.view lee; no miembro no', async () => {
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), path('sales/s1'))));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('sales/s1'))));
  });

  it('las ventas son inmutables (L6)', async () => {
    await assertFails(updateDoc(doc(as(env, OWNER), path('sales/s1')), { totalMinor: 1 }));
    await assertFails(deleteDoc(doc(as(env, OWNER), path('sales/s1'))));
  });

  it('valida el invariante total = base + impuestos y montos enteros', async () => {
    await assertFails(create(EMPLOYEE, saleData({ totalMinor: 1 })));
    await assertFails(
      create(EMPLOYEE, saleData({ subtotalMinor: 294118.5, totalMinor: 350000.5 })),
    );
    await assertFails(create(EMPLOYEE, saleData({ lines: [] })));
  });

  it('no acepta ventas con fecha futura ni de otro autor', async () => {
    const { Timestamp } = await import('firebase/firestore');
    await assertFails(
      create(EMPLOYEE, saleData({ occurredAt: Timestamp.fromMillis(Date.now() + 3_600_000) })),
    );
    await assertFails(
      setDoc(doc(as(env, EMPLOYEE), path('sales/x')), { ...saleData(), ...newAudit(OWNER) }),
    );
  });

  it('anular es un documento nuevo que exige sales.void', async () => {
    const voidSale = saleData({
      type: 'void',
      voidedSaleId: 's1',
      voidReason: 'Error de digitación',
      number: 'CAJA1-000002',
    });
    await assertFails(create(EMPLOYEE, voidSale));
    await assertSucceeds(create(CASHIER_PLUS, voidSale));
    await assertFails(
      create(CASHIER_PLUS, saleData({ type: 'void', voidedSaleId: 'no-existe', voidReason: 'x' })),
    );
  });
});

describe('cashShifts', () => {
  const open = (uid: string) =>
    setDoc(doc(as(env, uid), path('cashShifts/new')), {
      ...shiftData({ openedBy: uid, openedAt: serverTimestamp() }),
      ...newAudit(uid),
    });

  it('cash.open abre turno; no miembro no', async () => {
    await assertSucceeds(open(EMPLOYEE));
    await assertFails(open(OUTSIDER));
  });

  it('cerrar exige cash.close y respeta la máquina de estados (L8)', async () => {
    const closing = { status: 'closing', updatedAt: serverTimestamp() };
    await assertFails(updateDoc(doc(as(env, EMPLOYEE), path('cashShifts/shift1')), closing));
    await assertSucceeds(updateDoc(doc(as(env, CASHIER_PLUS), path('cashShifts/shift1')), closing));
    await assertSucceeds(
      updateDoc(doc(as(env, CASHIER_PLUS), path('cashShifts/shift1')), {
        status: 'closed',
        closedBy: CASHIER_PLUS,
        closedAt: serverTimestamp(),
        countedCashMinor: 5000000,
        expectedCashMinor: 5000000,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(as(env, OWNER), path('cashShifts/shift1')), {
        status: 'open',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('no se salta del turno abierto al cerrado', async () => {
    await assertFails(
      updateDoc(doc(as(env, OWNER), path('cashShifts/shift1')), {
        status: 'closed',
        closedBy: OWNER,
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('gastos: solo en turno abierto y con cash.open', async () => {
    const expense = (uid: string) => ({
      amountMinor: 10000,
      description: 'Hielo',
      ...newAudit(uid),
    });
    await assertSucceeds(
      addDoc(collection(as(env, EMPLOYEE), path('cashShifts/shift1/expenses')), expense(EMPLOYEE)),
    );
    await assertFails(
      addDoc(collection(as(env, OUTSIDER), path('cashShifts/shift1/expenses')), expense(OUTSIDER)),
    );
    await assertFails(
      addDoc(collection(as(env, EMPLOYEE), path('cashShifts/shift1/expenses')), {
        ...expense(EMPLOYEE),
        amountMinor: 0,
      }),
    );
  });
});
