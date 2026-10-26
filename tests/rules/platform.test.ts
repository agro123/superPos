import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  as,
  asPlatformAdmin,
  BID,
  createEnv,
  EMPLOYEE,
  newAudit,
  OUTSIDER,
  OWNER,
  PLATFORM_ADMIN,
  productData,
  seed,
} from './env';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createEnv();
});
beforeEach(async () => {
  await seed(env);
});
afterAll(async () => {
  await env.cleanup();
});

const business = (uid: string) => doc(as(env, uid), `businesses/${BID}`);
const touch = { updatedAt: serverTimestamp() };

describe('super administrador: lectura y uso', () => {
  it('lista todos los negocios; nadie más puede', async () => {
    await assertSucceeds(getDocs(collection(asPlatformAdmin(env), 'businesses')));
    await assertFails(getDocs(collection(as(env, OWNER), 'businesses')));
    await assertFails(getDocs(collection(as(env, OUTSIDER), 'businesses')));
  });

  it('cuenta registros de cualquier colección del negocio', async () => {
    await assertSucceeds(
      getCountFromServer(collection(asPlatformAdmin(env), `businesses/${BID}/sales`)),
    );
    await assertSucceeds(
      getCountFromServer(collection(asPlatformAdmin(env), `businesses/${BID}/members`)),
    );
    await assertFails(getCountFromServer(collection(as(env, OUTSIDER), `businesses/${BID}/sales`)));
    await assertFails(
      getCountFromServer(collection(as(env, OUTSIDER), `businesses/${BID}/products`)),
    );
  });

  it('el claim no se obtiene escribiendo datos: un usuario normal sigue sin acceso', async () => {
    await assertFails(getDocs(collection(as(env, PLATFORM_ADMIN), 'businesses')));
  });

  it('no escribe datos operativos del negocio', async () => {
    await assertFails(
      setDoc(doc(asPlatformAdmin(env), `businesses/${BID}/products/p9`), {
        ...productData(),
        ...newAudit(PLATFORM_ADMIN),
      }),
    );
  });
});

describe('super administrador: plan y estado', () => {
  it('cambia el plan; el admin del negocio no puede', async () => {
    await assertSucceeds(
      updateDoc(doc(asPlatformAdmin(env), `businesses/${BID}`), {
        plan: 'premium',
        status: 'active',
        ...touch,
      }),
    );
    await assertFails(updateDoc(business(OWNER), { plan: 'free', ...touch }));
    await assertFails(updateDoc(business(EMPLOYEE), { plan: 'premium', ...touch }));
    await assertFails(updateDoc(business(OUTSIDER), { plan: 'premium', ...touch }));
  });

  it('el admin del negocio no se desbloquea a sí mismo', async () => {
    await assertFails(updateDoc(business(OWNER), { status: 'active', ...touch }));
  });

  it('bloquear corta el acceso a los datos, no al documento del negocio', async () => {
    await assertSucceeds(
      updateDoc(doc(asPlatformAdmin(env), `businesses/${BID}`), {
        plan: 'free',
        status: 'blocked',
        ...touch,
      }),
    );
    await assertSucceeds(getDoc(business(EMPLOYEE)));
    await assertFails(getDoc(doc(as(env, EMPLOYEE), `businesses/${BID}/products/p1`)));
    await assertFails(getDoc(doc(as(env, OWNER), `businesses/${BID}/settings/modules`)));
    await assertFails(updateDoc(business(OWNER), { name: 'Sigo aquí', ...touch }));
  });

  it('respeta la máquina de estados: eliminado no pasa a bloqueado', async () => {
    const ref = doc(asPlatformAdmin(env), `businesses/${BID}`);
    await assertSucceeds(updateDoc(ref, { plan: 'free', status: 'deleted', ...touch }));
    await assertFails(updateDoc(ref, { status: 'blocked', ...touch }));
    await assertSucceeds(updateDoc(ref, { status: 'active', ...touch }));
  });

  it('rechaza planes y campos desconocidos', async () => {
    const ref = doc(asPlatformAdmin(env), `businesses/${BID}`);
    await assertFails(updateDoc(ref, { plan: 'gold', status: 'active', ...touch }));
    await assertFails(
      updateDoc(ref, { plan: 'free', status: 'active', currency: 'USD', ...touch }),
    );
  });
});

describe('alta de negocios', () => {
  const base = { name: 'Panadería Sol', type: 'cafe', currency: 'COP', timezone: 'America/Bogota' };

  it('la plataforma crea el negocio con la invitación del dueño', async () => {
    const db = asPlatformAdmin(env);
    const batch = writeBatch(db);
    batch.set(doc(db, 'businesses/p1'), {
      ...base,
      ownerUid: null,
      plan: 'premium',
      status: 'active',
      ...newAudit(PLATFORM_ADMIN),
    });
    batch.set(doc(db, 'businesses/p1/settings/modules'), {
      restaurant: false,
      customers: true,
      ...newAudit(PLATFORM_ADMIN),
    });
    batch.set(doc(db, 'businesses/p1/invitations/duena@example.co'), {
      email: 'duena@example.co',
      role: 'admin',
      extraPermissions: [],
      businessId: 'p1',
      businessName: 'Panadería Sol',
      ...newAudit(PLATFORM_ADMIN),
    });
    await assertSucceeds(batch.commit());
  });

  it('un usuario normal no crea negocios sin dueño ni con plan premium', async () => {
    await assertFails(
      setDoc(doc(as(env, OUTSIDER), 'businesses/p2'), {
        ...base,
        ownerUid: null,
        plan: 'free',
        status: 'active',
        ...newAudit(OUTSIDER),
      }),
    );
    const db = as(env, 'nuevo');
    const batch = writeBatch(db);
    batch.set(doc(db, 'businesses/p3'), {
      ...base,
      ownerUid: 'nuevo',
      plan: 'premium',
      status: 'active',
      ...newAudit('nuevo'),
    });
    batch.set(doc(db, 'businesses/p3/members/nuevo'), {
      displayName: 'Nuevo',
      email: 'nuevo@example.co',
      role: 'admin',
      extraPermissions: [],
      status: 'active',
      ...newAudit('nuevo'),
    });
    await assertFails(batch.commit());
  });
});
