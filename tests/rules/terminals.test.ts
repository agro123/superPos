import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  as,
  asTerminal,
  BID,
  createEnv,
  EMPLOYEE,
  newAudit,
  OUTSIDER,
  OWNER,
  REVOKED_TERMINAL,
  saleData,
  seed,
  TERMINAL,
} from './env';

let env: RulesTestEnvironment;
const path = (p: string) => `businesses/${BID}/${p}`;
const NEW_DEVICE = 'device-new';
const REQUEST = 'b'.repeat(64);
const UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

beforeAll(async () => {
  env = await createEnv();
});
beforeEach(async () => {
  await seed(env);
});
afterAll(async () => {
  await env.cleanup();
});

const requestData = (overrides: Record<string, unknown> = {}) => ({
  deviceUid: NEW_DEVICE,
  deviceUuid: UUID,
  deviceType: 'phone',
  status: 'pending',
  businessId: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: serverTimestamp(),
  ...overrides,
});

/** Crea la solicitud con reglas desactivadas y la antigüedad indicada (para probar expiración). */
async function seedRequest(ageMs: number) {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore;
    await setDoc(doc(db, `terminalPairingRequests/${REQUEST}`), {
      ...requestData({ createdAt: Timestamp.fromMillis(Date.now() - ageMs) }),
    });
  });
}

function approve(db: Firestore, uid: string, name = 'Caja 2') {
  const batch = writeBatch(db);
  batch.update(doc(db, `terminalPairingRequests/${REQUEST}`), {
    status: 'approved',
    businessId: BID,
    approvedBy: uid,
    approvedAt: serverTimestamp(),
  });
  batch.set(doc(db, path(`posTerminals/${NEW_DEVICE}`)), {
    deviceUuid: UUID,
    deviceType: 'phone',
    name,
    status: 'active',
    idleLockMinutes: 5,
    pairingRequestId: REQUEST,
    registeredBy: uid,
    authorizedAt: serverTimestamp(),
    lastSeenAt: null,
    revokedAt: null,
    ...newAudit(uid),
  });
  return batch.commit();
}

describe('vinculación de terminales', () => {
  it('un dispositivo anónimo crea su solicitud con vigencia de 5 minutos', async () => {
    const db = asTerminal(env, NEW_DEVICE);
    const ref = doc(db, `terminalPairingRequests/${REQUEST}`);
    // La vigencia se cuenta desde la hora del servidor: no se puede antedatar ni posdatar.
    await assertFails(
      setDoc(ref, requestData({ createdAt: Timestamp.fromMillis(Date.now() + 3_600_000) })),
    );
    await assertFails(setDoc(doc(db, 'terminalPairingRequests/corto'), requestData()));
    await assertFails(setDoc(ref, requestData({ status: 'approved' })));
    await assertSucceeds(setDoc(ref, requestData()));
    await assertSucceeds(getDoc(ref));
    await assertFails(
      setDoc(doc(as(env, OWNER), `terminalPairingRequests/${REQUEST}`), {
        ...requestData({ deviceUid: OWNER }),
      }),
    );
    // Otro dispositivo no la lee; un usuario autenticado que conoce el código sí.
    await assertFails(getDoc(doc(asTerminal(env, 'otro'), `terminalPairingRequests/${REQUEST}`)));
    await assertSucceeds(getDoc(doc(as(env, OWNER), `terminalPairingRequests/${REQUEST}`)));
  });

  it('solo un admin del negocio aprueba, una vez y antes de que venza', async () => {
    await seedRequest(0);
    await assertFails(approve(as(env, EMPLOYEE), EMPLOYEE));
    await assertFails(approve(as(env, OUTSIDER), OUTSIDER));
    // El QR por sí solo no autoriza: el terminal no puede aprobarse a sí mismo.
    await assertFails(approve(asTerminal(env, NEW_DEVICE), NEW_DEVICE));
    await assertSucceeds(approve(as(env, OWNER), OWNER));
    // Uso único.
    await assertFails(approve(as(env, OWNER), OWNER, 'Otra'));
  });

  it('una solicitud vencida no autoriza', async () => {
    await seedRequest(6 * 60_000);
    await assertFails(approve(as(env, OWNER), OWNER));
  });

  it('el terminal no se crea sin aprobar su solicitud en el mismo batch', async () => {
    await seedRequest(0);
    const db = as(env, OWNER);
    await assertFails(
      setDoc(doc(db, path(`posTerminals/${NEW_DEVICE}`)), {
        deviceUuid: UUID,
        deviceType: 'phone',
        name: 'Caja',
        status: 'active',
        idleLockMinutes: 5,
        pairingRequestId: REQUEST,
        registeredBy: OWNER,
        authorizedAt: serverTimestamp(),
        lastSeenAt: null,
        revokedAt: null,
        ...newAudit(OWNER),
      }),
    );
  });
});

describe('posTerminals', () => {
  it('el admin lista y administra; revocar es final', async () => {
    const admin = as(env, OWNER);
    await assertSucceeds(getDocs(collection(admin, path('posTerminals'))));
    await assertFails(getDocs(collection(as(env, EMPLOYEE), path('posTerminals'))));
    const ref = doc(admin, path(`posTerminals/${TERMINAL}`));
    await assertSucceeds(
      updateDoc(ref, { status: 'disabled', name: 'Caja 1', updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(updateDoc(ref, { status: 'active', updatedAt: serverTimestamp() }));
    await assertSucceeds(
      updateDoc(ref, {
        status: 'revoked',
        revokedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(ref, { status: 'active', updatedAt: serverTimestamp() }));
  });

  it('un empleado o el propio terminal no cambian su autorización', async () => {
    await assertFails(
      updateDoc(doc(as(env, EMPLOYEE), path(`posTerminals/${TERMINAL}`)), {
        status: 'disabled',
        updatedAt: serverTimestamp(),
      }),
    );
    const own = doc(asTerminal(env), path(`posTerminals/${TERMINAL}`));
    await assertFails(updateDoc(own, { name: 'Mía', updatedAt: serverTimestamp() }));
    await assertSucceeds(
      updateDoc(own, { lastSeenAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(doc(asTerminal(env, REVOKED_TERMINAL), path(`posTerminals/${REVOKED_TERMINAL}`)), {
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('un terminal activo ve el negocio y los trabajadores; uno revocado o ajeno no', async () => {
    await assertSucceeds(getDocs(collection(asTerminal(env), path('members'))));
    await assertSucceeds(getDoc(doc(asTerminal(env), `businesses/${BID}`)));
    await assertFails(getDocs(collection(asTerminal(env, REVOKED_TERMINAL), path('members'))));
    await assertFails(getDocs(collection(asTerminal(env, NEW_DEVICE), path('members'))));
    // Un terminal no lee datos operativos.
    await assertFails(getDocs(collection(asTerminal(env), path('sales'))));
  });
});

describe('terminalSessions', () => {
  const sessionData = (uid: string, terminalId = TERMINAL) => ({
    terminalId,
    memberUid: uid,
    loginMethod: 'password',
    status: 'active',
    startedAt: serverTimestamp(),
    endedAt: null,
    lastActivityAt: serverTimestamp(),
    ...newAudit(uid),
  });

  it('el trabajador abre su sesión solo en un terminal activo, y la cierra', async () => {
    const db = as(env, EMPLOYEE);
    await assertFails(setDoc(doc(db, path('terminalSessions/x')), sessionData(OWNER)));
    await assertFails(
      setDoc(doc(db, path('terminalSessions/x')), sessionData(EMPLOYEE, REVOKED_TERMINAL)),
    );
    await assertFails(
      setDoc(doc(as(env, OUTSIDER), path('terminalSessions/x')), sessionData(OUTSIDER)),
    );
    const ref = doc(db, path('terminalSessions/s1'));
    await assertSucceeds(setDoc(ref, sessionData(EMPLOYEE)));
    await assertSucceeds(
      updateDoc(ref, {
        status: 'closed',
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    // Una sesión cerrada no se reabre.
    await assertFails(updateDoc(ref, { status: 'active', updatedAt: serverTimestamp() }));
  });

  it('otro trabajador no cierra ni lee una sesión ajena; el admin sí la expira', async () => {
    await assertSucceeds(
      setDoc(doc(as(env, EMPLOYEE), path('terminalSessions/s1')), sessionData(EMPLOYEE)),
    );
    const close = (db: Firestore, status: string) =>
      updateDoc(doc(db, path('terminalSessions/s1')), {
        status,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    await assertFails(getDoc(doc(as(env, 'emp-plus'), path('terminalSessions/s1'))));
    await assertFails(close(as(env, 'emp-plus'), 'closed'));
    await assertSucceeds(close(as(env, OWNER), 'expired'));
  });
});

describe('ventas y terminal', () => {
  let n = 0;
  const sell = (uid: string, terminalId: string | null) =>
    setDoc(doc(as(env, uid), path(`sales/t${String((n += 1))}`)), {
      ...saleData({ terminalId }),
      ...newAudit(uid),
    });

  it('un empleado vende solo desde un terminal activo; el admin también sin terminal', async () => {
    await assertFails(sell(EMPLOYEE, null));
    await assertFails(sell(EMPLOYEE, REVOKED_TERMINAL));
    await assertSucceeds(sell(EMPLOYEE, TERMINAL));
    await assertSucceeds(sell(OWNER, null));
  });
});
