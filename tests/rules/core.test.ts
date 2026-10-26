import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  as,
  BID,
  createEnv,
  EMPLOYEE,
  INVITEE_EMAIL,
  newAudit,
  OUTSIDER,
  OWNER,
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

describe('denegación por defecto (L3)', () => {
  it('sin autenticación no se lee ni se escribe nada', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `businesses/${BID}`)));
    await assertFails(getDoc(doc(db, `businesses/${BID}/members/${OWNER}`)));
    await assertFails(setDoc(doc(db, 'anything/x'), { a: 1 }));
  });

  it('una colección no declarada está cerrada incluso para el admin', async () => {
    await assertFails(setDoc(doc(as(env, OWNER), `businesses/${BID}/secrets/x`), { a: 1 }));
  });
});

describe('users/{uid}', () => {
  const profile = (uid: string) => ({
    displayName: 'Ana',
    email: `${uid}@example.co`,
    businessIds: [],
    ...newAudit(uid),
  });

  it('cada usuario crea y lee solo su perfil', async () => {
    await assertSucceeds(setDoc(doc(as(env, 'ana'), 'users/ana'), profile('ana')));
    await assertSucceeds(getDoc(doc(as(env, 'ana'), 'users/ana')));
    await assertFails(getDoc(doc(as(env, 'luis'), 'users/ana')));
    await assertFails(setDoc(doc(as(env, 'luis'), 'users/ana'), profile('ana')));
  });

  it('rechaza campos no permitidos y email ajeno', async () => {
    await assertFails(
      setDoc(doc(as(env, 'ana'), 'users/ana'), { ...profile('ana'), isAdmin: true }),
    );
    await assertFails(
      setDoc(doc(as(env, 'ana'), 'users/ana'), { ...profile('ana'), email: 'otro@example.co' }),
    );
  });
});

describe('businesses/{bid}', () => {
  it('miembro lee; no miembro no', async () => {
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), `businesses/${BID}`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `businesses/${BID}`)));
  });

  it('solo settings.manage edita, y nunca la moneda', async () => {
    const ref = (uid: string) => doc(as(env, uid), `businesses/${BID}`);
    await assertSucceeds(
      updateDoc(ref(OWNER), { name: 'Tienda Dos', updatedAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(ref(EMPLOYEE), { name: 'Hack', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(OUTSIDER), { name: 'Hack', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(OWNER), { currency: 'USD', updatedAt: serverTimestamp() }));
  });

  it('onboarding: el negocio nace con su admin y su configuración en un batch', async () => {
    const db = as(env, 'nuevo');
    const batch = writeBatch(db);
    batch.set(doc(db, 'businesses/b2'), {
      name: 'Café Nuevo',
      type: 'cafe',
      currency: 'COP',
      timezone: 'America/Bogota',
      ownerUid: 'nuevo',
      plan: 'free',
      status: 'active',
      ...newAudit('nuevo'),
    });
    batch.set(doc(db, 'businesses/b2/members/nuevo'), {
      displayName: 'Nuevo',
      email: 'nuevo@example.co',
      role: 'admin',
      extraPermissions: [],
      status: 'active',
      ...newAudit('nuevo'),
    });
    batch.set(doc(db, 'businesses/b2/settings/modules'), {
      restaurant: false,
      customers: true,
      ...newAudit('nuevo'),
    });
    await assertSucceeds(batch.commit());
  });

  it('nadie se agrega como admin a un negocio existente', async () => {
    await assertFails(
      setDoc(doc(as(env, OUTSIDER), `businesses/${BID}/members/${OUTSIDER}`), {
        displayName: 'Intruso',
        email: `${OUTSIDER}@example.co`,
        role: 'admin',
        extraPermissions: [],
        status: 'active',
        ...newAudit(OUTSIDER),
      }),
    );
  });

  it('no se crea un negocio sin su miembro admin', async () => {
    await assertFails(
      setDoc(doc(as(env, 'nuevo'), 'businesses/b3'), {
        name: 'Solo',
        type: 'store',
        currency: 'COP',
        timezone: 'America/Bogota',
        ownerUid: 'nuevo',
        ...newAudit('nuevo'),
      }),
    );
  });
});

describe('members/{uid}', () => {
  const update = { role: 'admin', updatedAt: serverTimestamp() };

  it('miembros leen la lista; no miembros no', async () => {
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), `businesses/${BID}/members/${OWNER}`)));
    await assertFails(getDoc(doc(as(env, OUTSIDER), `businesses/${BID}/members/${OWNER}`)));
  });

  it('users.manage cambia roles; el empleado no se autoasciende', async () => {
    await assertFails(
      updateDoc(doc(as(env, EMPLOYEE), `businesses/${BID}/members/${EMPLOYEE}`), update),
    );
    await assertSucceeds(
      updateDoc(doc(as(env, OWNER), `businesses/${BID}/members/${EMPLOYEE}`), update),
    );
  });

  it('el dueño no puede perder su acceso ni se edita a sí mismo', async () => {
    await assertFails(
      updateDoc(doc(as(env, OWNER), `businesses/${BID}/members/${OWNER}`), {
        status: 'disabled',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('rechaza permisos inexistentes', async () => {
    await assertFails(
      updateDoc(doc(as(env, OWNER), `businesses/${BID}/members/${EMPLOYEE}`), {
        extraPermissions: ['god.mode'],
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('invitaciones', () => {
  const invitee = () => as(env, 'invitee', INVITEE_EMAIL);
  const memberDoc = (role: string) => ({
    displayName: 'Invitado',
    email: INVITEE_EMAIL,
    role,
    extraPermissions: [],
    status: 'active',
    ...newAudit('invitee'),
  });

  it('el invitado encuentra su invitación; otros no', async () => {
    const mine = query(
      collectionGroup(invitee(), 'invitations'),
      where('email', '==', INVITEE_EMAIL),
    );
    await assertSucceeds(getDocs(mine));
    const others = query(
      collectionGroup(as(env, OUTSIDER), 'invitations'),
      where('email', '==', INVITEE_EMAIL),
    );
    await assertFails(getDocs(others));
  });

  it('acepta con el rol invitado, nunca con otro', async () => {
    await assertFails(
      setDoc(doc(invitee(), `businesses/${BID}/members/invitee`), memberDoc('admin')),
    );
    const db = invitee();
    const batch = writeBatch(db);
    batch.set(doc(db, `businesses/${BID}/members/invitee`), memberDoc('employee'));
    batch.delete(doc(db, `businesses/${BID}/invitations/${INVITEE_EMAIL}`));
    await assertSucceeds(batch.commit());
  });

  it('requiere email verificado', async () => {
    const unverified = env
      .authenticatedContext('invitee', { email: INVITEE_EMAIL, email_verified: false })
      .firestore();
    await assertFails(
      setDoc(doc(unverified, `businesses/${BID}/members/invitee`), memberDoc('employee')),
    );
  });

  it('solo users.manage invita', async () => {
    const invitation = (uid: string) => ({
      email: 'nuevo@example.co',
      role: 'employee',
      extraPermissions: [],
      businessId: BID,
      businessName: 'Tienda Uno',
      ...newAudit(uid),
    });
    await assertSucceeds(
      setDoc(
        doc(as(env, OWNER), `businesses/${BID}/invitations/nuevo@example.co`),
        invitation(OWNER),
      ),
    );
    await assertFails(
      setDoc(
        doc(as(env, EMPLOYEE), `businesses/${BID}/invitations/otro@example.co`),
        invitation(EMPLOYEE),
      ),
    );
    await assertFails(
      deleteDoc(doc(as(env, EMPLOYEE), `businesses/${BID}/invitations/${INVITEE_EMAIL}`)),
    );
  });
});
