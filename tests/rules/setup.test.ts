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

const setup = (overrides: Record<string, unknown> = {}) => ({
  completedSteps: ['business'],
  skippedSteps: [],
  dismissedAt: null,
  completedAt: null,
  ...overrides,
});

describe('configuración inicial', () => {
  it('solo settings.manage guarda el avance, con campos válidos', async () => {
    await assertFails(
      setDoc(doc(as(env, EMPLOYEE), path('settings/setup')), { ...setup(), ...newAudit(EMPLOYEE) }),
    );
    await assertFails(
      setDoc(doc(as(env, OWNER), path('settings/setup')), {
        ...setup({ completedAt: 'ayer' }),
        ...newAudit(OWNER),
      }),
    );
    await assertSucceeds(
      setDoc(doc(as(env, OWNER), path('settings/setup')), { ...setup(), ...newAudit(OWNER) }),
    );
    await assertSucceeds(
      updateDoc(doc(as(env, OWNER), path('settings/setup')), {
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    // Todos los miembros lo leen (aviso de avance en Inicio).
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), path('settings/setup'))));
  });
});

describe('tour', () => {
  it('cada miembro marca solo su propio tour', async () => {
    const mark = (uid: string, target = uid) =>
      setDoc(doc(as(env, uid), path(`tourProgress/${target}`)), {
        status: 'done',
        ...newAudit(uid),
      });
    await assertSucceeds(mark(EMPLOYEE));
    await assertFails(mark(EMPLOYEE, OWNER));
    await assertFails(mark(OUTSIDER));
    await assertSucceeds(getDoc(doc(as(env, EMPLOYEE), path(`tourProgress/${EMPLOYEE}`))));
    await assertFails(getDoc(doc(as(env, OWNER), path(`tourProgress/${EMPLOYEE}`))));
  });
});
