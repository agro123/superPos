import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { as, BID, createEnv, EMPLOYEE, newAudit, OUTSIDER, OWNER, seed } from './env';

let env: RulesTestEnvironment;
const SLUG = 'tienda-uno';

beforeAll(async () => {
  env = await createEnv();
});
beforeEach(async () => {
  await seed(env);
});
afterAll(async () => {
  await env.cleanup();
});

const settings = (overrides: Record<string, unknown> = {}) => ({
  enabled: true,
  slug: SLUG,
  title: 'Tienda Uno',
  description: null,
  whatsapp: '573001234567',
  showOutOfStock: false,
  visibleProductIds: ['p1'],
  emailProvider: 'gmail',
  emailCustomUrl: null,
  ...overrides,
});
const catalog = (overrides: Record<string, unknown> = {}) => ({
  businessId: BID,
  enabled: true,
  title: 'Tienda Uno',
  description: null,
  whatsapp: '573001234567',
  currency: 'COP',
  ...overrides,
});
const item = () => ({
  name: 'Café',
  priceMinor: 350000,
  imageUrl: null,
  categoryName: null,
  available: true,
  sortOrder: 0,
});

/** Publica como lo hace la app: configuración + catálogo + producto en un batch. */
function publish(db: Firestore, uid: string, slug = SLUG) {
  const batch = writeBatch(db);
  batch.set(doc(db, `businesses/${BID}/settings/publicCatalog`), {
    ...settings({ slug }),
    ...newAudit(uid),
  });
  batch.set(doc(db, `publicCatalogs/${slug}`), { ...catalog(), ...newAudit(uid) });
  batch.set(doc(db, `publicCatalogs/${slug}/products/p1`), { ...item(), ...newAudit(uid) });
  return batch.commit();
}

describe('catálogo público', () => {
  it('solo quien administra el catálogo publica; el slug debe ser el configurado', async () => {
    await assertFails(publish(as(env, EMPLOYEE), EMPLOYEE));
    await assertFails(publish(as(env, OUTSIDER), OUTSIDER));
    await assertFails(publish(as(env, OWNER), OWNER, 'X_inválido'));
    // Un slug distinto al de la configuración no se puede activar.
    await assertFails(
      setDoc(doc(as(env, OWNER), 'publicCatalogs/otro-slug'), {
        ...catalog(),
        ...newAudit(OWNER),
      }),
    );
    await assertSucceeds(publish(as(env, OWNER), OWNER));
  });

  it('cualquiera (sin sesión) lee el catálogo activo; desactivado, nadie de afuera', async () => {
    await publish(as(env, OWNER), OWNER);
    const anon = env.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertSucceeds(getDoc(doc(anon, 'publicCatalogs/no-existe')));
    await assertSucceeds(getDoc(doc(anon, `publicCatalogs/${SLUG}`)));
    await assertSucceeds(getDocs(collection(anon, `publicCatalogs/${SLUG}/products`)));
    // Sin sesión no se escribe ni se lee nada privado.
    await assertFails(setDoc(doc(anon, `publicCatalogs/${SLUG}/products/x`), item()));
    await assertFails(getDoc(doc(anon, `businesses/${BID}/products/p1`)));

    await assertSucceeds(
      updateDoc(doc(as(env, OWNER), `publicCatalogs/${SLUG}`), {
        enabled: false,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(getDoc(doc(anon, `publicCatalogs/${SLUG}`)));
    await assertFails(getDocs(collection(anon, `publicCatalogs/${SLUG}/products`)));
    await assertSucceeds(getDoc(doc(as(env, OWNER), `publicCatalogs/${SLUG}`)));
  });

  it('otro negocio no se apropia ni modifica el catálogo', async () => {
    await publish(as(env, OWNER), OWNER);
    await assertFails(
      updateDoc(doc(as(env, OUTSIDER), `publicCatalogs/${SLUG}`), {
        title: 'Mío',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(doc(as(env, OUTSIDER), `publicCatalogs/${SLUG}/products/p1`)));
    await assertSucceeds(deleteDoc(doc(as(env, OWNER), `publicCatalogs/${SLUG}/products/p1`)));
  });

  it('la configuración valida WhatsApp y el enlace de correo', async () => {
    const ref = doc(as(env, OWNER), `businesses/${BID}/settings/publicCatalog`);
    await assertFails(setDoc(ref, { ...settings({ whatsapp: '+57 300' }), ...newAudit(OWNER) }));
    await assertFails(
      setDoc(ref, {
        ...settings({ emailProvider: 'custom', emailCustomUrl: 'javascript:alert(1)' }),
        ...newAudit(OWNER),
      }),
    );
    await assertSucceeds(setDoc(ref, { ...settings(), ...newAudit(OWNER) }));
    // Todos los miembros la leen (para compartir y mostrar el QR).
    await assertSucceeds(
      getDoc(doc(as(env, EMPLOYEE), `businesses/${BID}/settings/publicCatalog`)),
    );
  });
});
