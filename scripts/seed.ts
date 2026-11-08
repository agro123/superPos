/**
 * Siembra los emuladores con 2 negocios de ejemplo (tienda y cafetería).
 * Uso: `pnpm emulators` en una terminal y `pnpm seed` en otra (o `pnpm test:e2e`).
 * SOLO apunta al emulador: aborta ante un proyecto real (scripts/seedGuard.ts, L13).
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import { BUSINESSES, PLATFORM_ADMINS, SEED_PASSWORD, USERS } from './seedData';
import { buildSeedWrites } from './seedWrites';
import { resolveSeedTarget } from './seedGuard';

const target = resolveSeedTarget(process.env);
process.env.FIRESTORE_EMULATOR_HOST = target.firestoreHost;
process.env.FIREBASE_AUTH_EMULATOR_HOST = target.authHost;

const app = initializeApp({ projectId: target.projectId });
const db = getFirestore(app);
const auth = getAuth(app);
const now = new Date();

async function clearEmulators(): Promise<void> {
  const firestoreUrl = `http://${target.firestoreHost}/emulator/v1/projects/${target.projectId}/databases/(default)/documents`;
  const authUrl = `http://${target.authHost}/emulator/v1/projects/${target.projectId}/accounts`;
  for (const url of [firestoreUrl, authUrl]) {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error(`No se pudo limpiar ${url}: ${response.status}`);
  }
}

/** Escribe en lotes de 400 operaciones (límite de Firestore: 500). */
async function writeAll(firestore: Firestore, writes: [string, DocumentData][]): Promise<void> {
  for (let i = 0; i < writes.length; i += 400) {
    const batch = firestore.batch();
    for (const [path, data] of writes.slice(i, i + 400)) batch.set(firestore.doc(path), data);
    await batch.commit();
  }
}

async function main(): Promise<void> {
  console.info(`Sembrando ${target.projectId} en ${target.firestoreHost} / ${target.authHost}`);
  await clearEmulators();

  for (const user of USERS) {
    await auth.createUser({
      uid: user.uid,
      email: user.email,
      password: SEED_PASSWORD,
      displayName: user.displayName,
      emailVerified: true,
    });
  }
  for (const uid of PLATFORM_ADMINS) await auth.setCustomUserClaims(uid, { platformAdmin: true });

  const writes = buildSeedWrites(now);
  await writeAll(db, writes);
  console.info(
    `Listo: ${USERS.length} usuarios, ${BUSINESSES.length} negocios, ${writes.length} documentos.`,
  );
  console.info(
    `Usuarios: ${USERS.map((user) => user.email).join(', ')} · contraseña: ${SEED_PASSWORD}`,
  );
  console.info(`Super administradores: ${PLATFORM_ADMINS.join(', ')}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
