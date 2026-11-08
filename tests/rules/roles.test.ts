import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { as, BID, createEnv, EMPLOYEE, newAudit, OWNER, saleData, seed } from './env';

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

const role = { name: 'Inventario', permissions: ['inventory.view', 'inventory.adjust'] };

async function makeStockKeeper() {
  await setDoc(doc(as(env, OWNER), path('roles/inv')), { ...role, ...newAudit(OWNER) });
  await updateDoc(doc(as(env, OWNER), path(`members/${EMPLOYEE}`)), {
    role: 'custom',
    customRoleId: 'inv',
    extraPermissions: role.permissions,
    updatedAt: serverTimestamp(),
  });
}

describe('roles personalizados', () => {
  it('solo users.manage crea roles, con permisos válidos', async () => {
    await assertFails(
      setDoc(doc(as(env, EMPLOYEE), path('roles/x')), { ...role, ...newAudit(EMPLOYEE) }),
    );
    await assertFails(
      setDoc(doc(as(env, OWNER), path('roles/x')), {
        name: 'Dios',
        permissions: ['god.mode'],
        ...newAudit(OWNER),
      }),
    );
    await assertSucceeds(
      setDoc(doc(as(env, OWNER), path('roles/x')), { ...role, ...newAudit(OWNER) }),
    );
  });

  it('un miembro "custom" exige un rol existente', async () => {
    await assertFails(
      updateDoc(doc(as(env, OWNER), path(`members/${EMPLOYEE}`)), {
        role: 'custom',
        customRoleId: 'no-existe',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(as(env, OWNER), path(`members/${EMPLOYEE}`)), {
        role: 'employee',
        customRoleId: 'inv',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('el rol "custom" solo tiene los permisos de su plantilla', async () => {
    await makeStockKeeper();
    const db = as(env, EMPLOYEE);
    // Ya no vende (el rol no incluye sales.create)...
    await assertFails(setDoc(doc(db, path('sales/n1')), { ...saleData(), ...newAudit(EMPLOYEE) }));
    // ...pero sí ajusta inventario.
    await assertSucceeds(
      addDoc(collection(db, path('inventoryMovements')), {
        productId: 'p1',
        type: 'adjustment',
        quantityDelta: -1,
        reason: 'Merma',
        saleId: null,
        supplierId: null,
        ...newAudit(EMPLOYEE),
      }),
    );
  });

  it('una invitación con rol personalizado se acepta con exactamente ese rol', async () => {
    await setDoc(doc(as(env, OWNER), path('roles/inv')), { ...role, ...newAudit(OWNER) });
    await assertSucceeds(
      setDoc(doc(as(env, OWNER), path('invitations/nuevo@example.co')), {
        email: 'nuevo@example.co',
        role: 'custom',
        customRoleId: 'inv',
        extraPermissions: role.permissions,
        businessId: BID,
        businessName: 'Tienda Uno',
        ...newAudit(OWNER),
      }),
    );
    const invitee = as(env, 'nuevo', 'nuevo@example.co');
    const accept = (customRoleId: string | null) => {
      const batch = writeBatch(invitee);
      batch.set(doc(invitee, path('members/nuevo')), {
        displayName: 'Nuevo',
        email: 'nuevo@example.co',
        role: 'custom',
        customRoleId,
        extraPermissions: role.permissions,
        status: 'active',
        seatId: '3',
        ...newAudit('nuevo'),
      });
      batch.set(doc(invitee, path('seats/3')), { uid: 'nuevo', ...newAudit('nuevo') });
      return batch.commit();
    };
    await assertFails(accept(null));
    await assertSucceeds(accept('inv'));
  });
});
