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
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  getDocs,
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
  const create = (uid: string, data = saleData(), id = 'new') =>
    setDoc(doc(as(env, uid), path(`sales/${id}`)), { ...data, ...newAudit(uid) });

  it('sales.create registra; no miembro no', async () => {
    await assertSucceeds(create(EMPLOYEE));
    await assertFails(create(OUTSIDER));
  });

  it('sales.view lee; no miembro no', async () => {
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), path('sales/s1'))));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('sales/s1'))));
  });

  it('venta + descuento de stock + movimiento en un solo writeBatch (L1)', async () => {
    const db = as(env, EMPLOYEE);
    const batch = writeBatch(db);
    batch.set(doc(db, path('sales/batch1')), {
      ...saleData({ cashShiftId: 'shift1' }),
      ...newAudit(EMPLOYEE),
    });
    batch.update(doc(db, path('products/p1')), {
      stock: increment(-1),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, path('inventoryMovements/m1')), {
      productId: 'p1',
      type: 'sale',
      quantityDelta: -1,
      reason: null,
      saleId: 'batch1',
      supplierId: null,
      ...newAudit(EMPLOYEE),
    });
    await assertSucceeds(batch.commit());
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
    await assertFails(create(EMPLOYEE, voidSale, 'void-s1'));
    // El id debe ser `void-<venta>`: no hay dos anulaciones de la misma venta.
    await assertFails(create(CASHIER_PLUS, voidSale, 'otro'));
    await assertSucceeds(create(CASHIER_PLUS, voidSale, 'void-s1'));
    await assertFails(create(CASHIER_PLUS, voidSale, 'void-s1'));
    await assertFails(
      create(
        CASHIER_PLUS,
        saleData({ type: 'void', voidedSaleId: 'no-existe', voidReason: 'x' }),
        'void-no-existe',
      ),
    );
  });

  it('la anulación devuelve stock solo con sales.void', async () => {
    const back = (uid: string) =>
      updateDoc(doc(as(env, uid), path('products/p1')), {
        stock: increment(1),
        updatedAt: serverTimestamp(),
      });
    await assertFails(back(EMPLOYEE));
    await assertSucceeds(back(CASHIER_PLUS));
  });

  it('fiado: solo a un cliente registrado y con un pago "credit"', async () => {
    const credit = (overrides: Record<string, unknown>) =>
      saleData({
        payments: [{ method: 'credit', amountMinor: 350000, status: 'captured', reference: null }],
        creditMinor: 350000,
        customerId: 'cu1',
        ...overrides,
      });
    await assertFails(create(EMPLOYEE, credit({ customerId: null })));
    await assertFails(create(EMPLOYEE, credit({ customerId: 'no-existe' })));
    // creditMinor debe corresponder a un pago "credit".
    await assertFails(create(EMPLOYEE, credit({ creditMinor: 0 })));
    await assertFails(create(EMPLOYEE, saleData({ creditMinor: 350000, customerId: 'cu1' })));
    await assertFails(create(EMPLOYEE, credit({ creditMinor: 999999999 })));
    await assertSucceeds(create(EMPLOYEE, credit({})));
  });
});

describe('creditPayments', () => {
  const pay = (uid: string, overrides: Record<string, unknown> = {}) =>
    setDoc(doc(as(env, uid), path('creditPayments/new')), {
      customerId: 'cu1',
      amountMinor: 100000,
      method: 'cash',
      cashShiftId: 'shift1',
      occurredAt: Timestamp.fromMillis(Date.now() - 1000),
      ...newAudit(uid),
      ...overrides,
    });

  it('abono con turno abierto y cliente existente; no miembro no', async () => {
    await assertFails(pay(OUTSIDER));
    await assertFails(pay(EMPLOYEE, { customerId: 'no-existe' }));
    await assertFails(pay(EMPLOYEE, { amountMinor: 0 }));
    await assertFails(pay(EMPLOYEE, { method: 'credit' }));
    await assertSucceeds(pay(EMPLOYEE));
    await assertSucceeds(getDocs(collection(as(env, EMPLOYEE), path('creditPayments'))));
    // Inmutable.
    await assertFails(
      updateDoc(doc(as(env, OWNER), path('creditPayments/new')), { amountMinor: 1 }),
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
