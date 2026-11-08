/**
 * Carga de demostración en un proyecto real: los 2 negocios ficticios del seed, sus usuarios (con
 * DEMO_PASSWORD, no la del repositorio) y su historial. Idempotente: vuelve a escribir los mismos
 * ids y actualiza los usuarios existentes. No crea super administradores (el real ya existe).
 *
 *   DEMO_PROJECT_ID=superpos-univalle DEMO_CONFIRM=superpos-univalle \
 *   GOOGLE_APPLICATION_CREDENTIALS=./sa.json DEMO_PASSWORD='…' pnpm demo
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { resolveDemoTarget } from './demoGuard';
import { PLATFORM_ADMINS, USERS } from './seedData';
import { buildSeedWrites } from './seedWrites';

const target = resolveDemoTarget(process.env);
const app = initializeApp({ credential: applicationDefault(), projectId: target.projectId });
const db = getFirestore(app);
const auth = getAuth(app);

async function upsertUsers(): Promise<number> {
  const users = USERS.filter((user) => !PLATFORM_ADMINS.includes(user.uid));
  for (const user of users) {
    const data = {
      email: user.email,
      password: target.password,
      displayName: user.displayName,
      emailVerified: true,
    };
    try {
      await auth.updateUser(user.uid, data);
    } catch {
      await auth.createUser({ uid: user.uid, ...data });
    }
  }
  return users.length;
}

async function main(): Promise<void> {
  console.info(`Cargando la demostración en ${target.projectId}…`);
  const users = process.env.DEMO_SKIP_AUTH === 'true' ? 0 : await upsertUsers();
  const writes = buildSeedWrites(new Date()).filter(
    ([path]) => !PLATFORM_ADMINS.some((uid) => path === `users/${uid}`),
  );
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    for (const [path, data] of writes.slice(i, i + 400)) batch.set(db.doc(path), data);
    await batch.commit();
  }
  console.info(
    `Listo: ${String(users)} usuarios y ${String(writes.length)} documentos de demostración.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
