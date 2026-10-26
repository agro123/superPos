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
  productData,
  seed,
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

describe('products', () => {
  it('miembro lee; no miembro no', async () => {
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), path('products/p1'))));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('products/p1'))));
  });

  it('catalog.manage crea; empleado y no miembro no', async () => {
    const create = (uid: string) =>
      setDoc(doc(as(env, uid), path('products/p2')), { ...productData(), ...newAudit(uid) });
    await assertSucceeds(create(OWNER));
    await assertFails(create(EMPLOYEE));
    await assertFails(create(OUTSIDER));
  });

  it('valida tipos: precio entero no negativo (L10) y campos permitidos', async () => {
    const db = as(env, OWNER);
    await assertFails(
      setDoc(doc(db, path('products/p3')), {
        ...productData({ priceMinor: 10.5 }),
        ...newAudit(OWNER),
      }),
    );
    await assertFails(
      setDoc(doc(db, path('products/p3')), {
        ...productData({ priceMinor: -1 }),
        ...newAudit(OWNER),
      }),
    );
    await assertFails(
      setDoc(doc(db, path('products/p3')), { ...productData(), extra: true, ...newAudit(OWNER) }),
    );
    await assertFails(
      setDoc(doc(db, path('products/p3')), { ...productData(), ...newAudit('otro') }),
    );
  });

  it('editar el catálogo no cambia el stock', async () => {
    const db = as(env, OWNER);
    await assertSucceeds(
      updateDoc(doc(db, path('products/p1')), { priceMinor: 400000, updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(doc(db, path('products/p1')), { stock: 99, updatedAt: serverTimestamp() }),
    );
    const plus = as(env, CASHIER_PLUS);
    await assertFails(
      updateDoc(doc(plus, path('products/p1')), {
        stock: 5,
        priceMinor: 1,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('quien vende solo puede descontar stock con increment (L1)', async () => {
    const db = as(env, EMPLOYEE);
    await assertSucceeds(
      updateDoc(doc(db, path('products/p1')), {
        stock: increment(-2),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, path('products/p1')), {
        stock: increment(5),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, path('products/p1')), { priceMinor: 1, updatedAt: serverTimestamp() }),
    );
  });

  it('no se borran productos (se desactivan)', async () => {
    await assertFails(deleteDoc(doc(as(env, OWNER), path('products/p1'))));
  });
});

describe('categories', () => {
  const category = (uid: string) => ({
    name: 'Postres',
    color: 'warning',
    sortOrder: 1,
    ...newAudit(uid),
  });

  it('catalog.manage crea y borra; empleado no', async () => {
    await assertSucceeds(setDoc(doc(as(env, OWNER), path('categories/c2')), category(OWNER)));
    await assertFails(setDoc(doc(as(env, EMPLOYEE), path('categories/c3')), category(EMPLOYEE)));
    await assertFails(deleteDoc(doc(as(env, EMPLOYEE), path('categories/c1'))));
    await assertSucceeds(deleteDoc(doc(as(env, OWNER), path('categories/c1'))));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('categories/c1'))));
  });

  it('solo colores del sistema de diseño', async () => {
    await assertFails(
      setDoc(doc(as(env, OWNER), path('categories/c4')), { ...category(OWNER), color: '#ff0000' }),
    );
  });
});

describe('inventoryMovements', () => {
  const movement = (uid: string, type: string) => ({
    productId: 'p1',
    type,
    quantityDelta: -1,
    reason: null,
    saleId: null,
    ...newAudit(uid),
  });

  it('inventory.adjust registra ajustes; el empleado solo movimientos de venta', async () => {
    await assertSucceeds(
      addDoc(collection(as(env, OWNER), path('inventoryMovements')), movement(OWNER, 'adjustment')),
    );
    await assertFails(
      addDoc(
        collection(as(env, EMPLOYEE), path('inventoryMovements')),
        movement(EMPLOYEE, 'adjustment'),
      ),
    );
    await assertSucceeds(
      addDoc(collection(as(env, EMPLOYEE), path('inventoryMovements')), movement(EMPLOYEE, 'sale')),
    );
    await assertFails(
      addDoc(collection(as(env, OUTSIDER), path('inventoryMovements')), movement(OUTSIDER, 'sale')),
    );
  });

  it('la bitácora es inmutable', async () => {
    const db = as(env, OWNER);
    await setDoc(doc(db, path('inventoryMovements/m1')), movement(OWNER, 'adjustment'));
    await assertFails(updateDoc(doc(db, path('inventoryMovements/m1')), { quantityDelta: 100 }));
    await assertFails(deleteDoc(doc(db, path('inventoryMovements/m1'))));
  });
});

describe('suppliers', () => {
  const supplier = (uid: string) => ({
    name: 'Distribuidora',
    phone: null,
    email: null,
    ...newAudit(uid),
  });

  it('inventory.adjust gestiona; empleado lee pero no escribe; no miembro nada', async () => {
    await assertSucceeds(setDoc(doc(as(env, OWNER), path('suppliers/s1')), supplier(OWNER)));
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), path('suppliers/s1'))));
    await assertFails(setDoc(doc(as(env, EMPLOYEE), path('suppliers/s2')), supplier(EMPLOYEE)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('suppliers/s1'))));
  });
});
