import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { as, BID, createEnv, EMPLOYEE, newAudit, OUTSIDER, OWNER, seed } from './env';

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

const disableModule = (moduleId: 'restaurant' | 'customers') =>
  updateDoc(doc(as(env, OWNER), path('settings/modules')), {
    [moduleId]: false,
    updatedAt: serverTimestamp(),
  });

describe('settings', () => {
  it('miembro lee; solo settings.manage escribe', async () => {
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), path('settings/modules'))));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('settings/modules'))));
    await assertFails(
      updateDoc(doc(as(env, EMPLOYEE), path('settings/modules')), {
        restaurant: false,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(disableModule('restaurant'));
  });

  it('solo documentos y medios de pago conocidos', async () => {
    const db = as(env, OWNER);
    await assertFails(
      setDoc(doc(db, path('settings/secret')), { enabled: ['cash'], ...newAudit(OWNER) }),
    );
    await assertSucceeds(
      setDoc(doc(db, path('settings/paymentMethods')), {
        enabled: ['cash', 'card'],
        ...newAudit(OWNER),
      }),
    );
    await assertFails(
      setDoc(doc(db, path('settings/paymentMethods')), {
        enabled: ['bitcoin'],
        ...newAudit(OWNER),
      }),
    );
  });
});

describe('customers (módulo)', () => {
  const customer = (uid: string) => ({
    name: 'Luis',
    documentId: null,
    phone: null,
    email: null,
    notes: null,
    ...newAudit(uid),
  });

  it('el empleado gestiona clientes; no miembro no', async () => {
    await assertSucceeds(setDoc(doc(as(env, EMPLOYEE), path('customers/cu2')), customer(EMPLOYEE)));
    await assertFails(setDoc(doc(as(env, OUTSIDER), path('customers/cu3')), customer(OUTSIDER)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('customers/cu1'))));
  });

  it('con el módulo desactivado no hay acceso', async () => {
    await disableModule('customers');
    await assertFails(getDoc(doc(as(env, EMPLOYEE), path('customers/cu1'))));
  });
});

describe('restaurant (módulo)', () => {
  it('quien vende cambia el estado de la mesa, no su configuración', async () => {
    const db = as(env, EMPLOYEE);
    await assertSucceeds(
      updateDoc(doc(db, path('restaurantTables/t1')), {
        status: 'occupied',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, path('restaurantTables/t1')), { seats: 10, updatedAt: serverTimestamp() }),
    );
    await assertFails(getDoc(doc(as(env, OUTSIDER), path('restaurantTables/t1'))));
  });

  it('con el módulo desactivado no hay acceso', async () => {
    await disableModule('restaurant');
    await assertFails(getDoc(doc(as(env, EMPLOYEE), path('restaurantTables/t1'))));
    await assertFails(getDoc(doc(as(env, OWNER), path('restaurantTables/t1'))));
  });

  it('settings.manage crea mesas libres', async () => {
    const table = { name: 'Mesa 2', zoneId: 'z1', seats: 2, status: 'free', ...newAudit(OWNER) };
    await assertSucceeds(setDoc(doc(as(env, OWNER), path('restaurantTables/t2')), table));
    await assertFails(
      setDoc(doc(as(env, EMPLOYEE), path('restaurantTables/t3')), {
        ...table,
        createdBy: EMPLOYEE,
      }),
    );
  });
});
