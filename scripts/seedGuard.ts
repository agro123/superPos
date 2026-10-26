/**
 * Barrera de seguridad del seed (L13): solo escribe en los emuladores locales y en proyectos demo-*.
 * Nunca debe poder apuntar a un proyecto real.
 */
export interface SeedTarget {
  projectId: string;
  firestoreHost: string;
  authHost: string;
}

const LOCAL_HOST = /^(127\.0\.0\.1|localhost|\[::1\]):\d+$/;

export function resolveSeedTarget(env: Record<string, string | undefined>): SeedTarget {
  const projectId = env.GCLOUD_PROJECT ?? env.SEED_PROJECT_ID ?? 'demo-superpos';
  const firestoreHost = env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
  const authHost = env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
  if (!projectId.startsWith('demo-')) {
    throw new Error(
      `Seed abortado: "${projectId}" no es un proyecto demo-*. El seed solo apunta al emulador.`,
    );
  }
  if (!LOCAL_HOST.test(firestoreHost) || !LOCAL_HOST.test(authHost)) {
    throw new Error(
      `Seed abortado: los emuladores deben ser locales (Firestore=${firestoreHost}, Auth=${authHost}).`,
    );
  }
  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'Seed abortado: hay credenciales de servicio configuradas (GOOGLE_APPLICATION_CREDENTIALS).',
    );
  }
  return { projectId, firestoreHost, authHost };
}
