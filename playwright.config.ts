import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Los e2e corren contra el build de producción (para probar el Service Worker real)
 * conectado a los emuladores sembrados. Usar `pnpm test:e2e`, que levanta los emuladores.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-superpos.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-superpos',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-superpos.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000',
      VITE_APP_CHECK_SITE_KEY: '',
    },
  },
});
