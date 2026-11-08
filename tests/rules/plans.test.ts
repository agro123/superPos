import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  as,
  BID,
  CASHIER_PLUS,
  createEnv,
  EMPLOYEE,
  freePlan,
  INVITEE_EMAIL,
  newAudit,
  OWNER,
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

const invitee = () => as(env, 'invitee', INVITEE_EMAIL);

/** Acepta la invitación de empleado tomando el cupo indicado. */
function accept(seatId: string | null) {
  const db = invitee();
  const batch = writeBatch(db);
  batch.set(doc(db, path('members/invitee')), {
    displayName: 'Invitado',
    email: INVITEE_EMAIL,
    role: 'employee',
    extraPermissions: [],
    status: 'active',
    seatId,
    ...newAudit('invitee'),
  });
  if (seatId)
    batch.set(doc(db, path(`seats/${seatId}`)), { uid: 'invitee', ...newAudit('invitee') });
  batch.delete(doc(db, path(`invitations/${INVITEE_EMAIL}`)));
  return batch.commit();
}

describe('cupos de trabajador', () => {
  it('premium: hasta 3; un empleado nuevo necesita un cupo libre', async () => {
    await assertFails(accept(null));
    await assertFails(accept('1')); // ocupado
    await assertFails(accept('4')); // no existe en ningún plan
    await assertSucceeds(accept('3'));
  });

  it('gratis: un solo cupo (ya ocupado)', async () => {
    await freePlan(env);
    await assertFails(accept('3'));
    // Liberando el cupo 1 (empleado desactivado), el nuevo entra.
    const admin = as(env, OWNER);
    const batch = writeBatch(admin);
    batch.update(doc(admin, path(`members/${EMPLOYEE}`)), {
      status: 'disabled',
      seatId: null,
      updatedAt: serverTimestamp(),
    });
    batch.delete(doc(admin, path('seats/1')));
    await assertSucceeds(batch.commit());
    await assertSucceeds(accept('1'));
  });

  it('reactivar o cambiar a empleado exige asignarle un cupo', async () => {
    const admin = as(env, OWNER);
    await assertSucceeds(
      updateDoc(doc(admin, path(`members/${EMPLOYEE}`)), {
        status: 'disabled',
        seatId: null,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(deleteDoc(doc(admin, path('seats/1'))));
    await assertFails(
      updateDoc(doc(admin, path(`members/${EMPLOYEE}`)), {
        status: 'active',
        updatedAt: serverTimestamp(),
      }),
    );
    const batch = writeBatch(admin);
    batch.update(doc(admin, path(`members/${EMPLOYEE}`)), {
      status: 'active',
      seatId: '1',
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(admin, path('seats/1')), { uid: EMPLOYEE, ...newAudit(OWNER) });
    await assertSucceeds(batch.commit());
  });

  it('nadie se queda el cupo de otro', async () => {
    await assertFails(
      setDoc(doc(as(env, EMPLOYEE), path('seats/3')), { uid: EMPLOYEE, ...newAudit(EMPLOYEE) }),
    );
    await assertFails(deleteDoc(doc(as(env, CASHIER_PLUS), path('seats/1'))));
  });
});

describe('funciones premium en las reglas', () => {
  const role = { name: 'Cajero', permissions: ['sales.create'] };
  const adminInvite = {
    email: 'socio@example.co',
    role: 'admin',
    extraPermissions: [],
    businessId: BID,
    businessName: 'Tienda Uno',
  };

  it('gratis: sin roles personalizados ni más administradores', async () => {
    await freePlan(env);
    await assertFails(
      setDoc(doc(as(env, OWNER), path('roles/r1')), { ...role, ...newAudit(OWNER) }),
    );
    await assertFails(
      setDoc(doc(as(env, OWNER), path('invitations/socio@example.co')), {
        ...adminInvite,
        ...newAudit(OWNER),
      }),
    );
  });

  it('premium: sí', async () => {
    await assertSucceeds(
      setDoc(doc(as(env, OWNER), path('roles/r1')), { ...role, ...newAudit(OWNER) }),
    );
    await assertSucceeds(
      setDoc(doc(as(env, OWNER), path('invitations/socio@example.co')), {
        ...adminInvite,
        ...newAudit(OWNER),
      }),
    );
  });
});
