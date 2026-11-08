/**
 * Barrera de la carga de demostración: el seed normal nunca toca un proyecto real (seedGuard.ts);
 * esta carga solo escribe datos ficticios en un proyecto real con confirmación explícita.
 */
export interface DemoTarget {
  projectId: string;
  password: string;
}

export function resolveDemoTarget(env: Record<string, string | undefined>): DemoTarget {
  const projectId = env.DEMO_PROJECT_ID ?? '';
  if (!projectId || projectId.startsWith('demo-')) {
    throw new Error(
      'Demo abortada: define DEMO_PROJECT_ID con un proyecto real (para demo-* usa `pnpm seed`).',
    );
  }
  if (env.DEMO_CONFIRM !== projectId) {
    throw new Error(
      `Demo abortada: confirma con DEMO_CONFIRM=${projectId} (escribe datos de ejemplo en ese proyecto).`,
    );
  }
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('Demo abortada: hay variables de emulador definidas.');
  }
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Demo abortada: falta GOOGLE_APPLICATION_CREDENTIALS (cuenta de servicio).');
  }
  const password = env.DEMO_PASSWORD ?? '';
  // La contraseña del seed (superpos123) es pública en el repositorio: no sirve para un sitio real.
  if (password.length < 10 || password === 'superpos123') {
    throw new Error('Demo abortada: DEMO_PASSWORD debe tener 10+ caracteres y no ser la del seed.');
  }
  return { projectId, password };
}
