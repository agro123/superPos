import { defineConfig } from 'vitest/config';

/** Pruebas de Security Rules: requieren el emulador de Firestore (ver `pnpm test:rules`). */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
