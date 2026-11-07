import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import {
  browserLocalPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { logger } from '@/shared/lib/logger';
import { readEnv } from './env';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let services: FirebaseServices | null = null;

function webConfig(env: ReturnType<typeof readEnv>) {
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

function initialize(): FirebaseServices {
  const env = readEnv();
  const app = initializeApp(webConfig(env));

  // App Check antes de usar otros servicios. Desactivado con emuladores o sin clave de sitio.
  if (!env.VITE_USE_EMULATORS && env.VITE_APP_CHECK_SITE_KEY) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(env.VITE_APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }

  // La sesión persiste en IndexedDB: se puede seguir trabajando sin red con el último usuario.
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });

  // Caché persistente (IndexedDB) compartida entre pestañas: lecturas offline y escrituras en cola.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  const storage = getStorage(app);

  if (env.VITE_USE_EMULATORS) {
    const host = env.VITE_EMULATOR_HOST;
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectStorageEmulator(storage, host, 9199);
    logger.info('Firebase conectado a los emuladores', { host });
  }

  return { app, auth, db, storage };
}

/** Servicios de Firebase inicializados una sola vez (inicialización perezosa). */
export function getFirebase(): FirebaseServices {
  services ??= initialize();
  return services;
}

export interface TerminalFirebase {
  auth: Auth;
  db: Firestore;
}

let terminalServices: TerminalFirebase | null = null;

/**
 * Segunda instancia de Firebase para la identidad del terminal POS (sesión anónima de la
 * instalación). Va aparte para que el login de un trabajador en la instancia principal no la
 * reemplace. Caché en memoria: el terminal solo lee su estado y la lista de trabajadores.
 */
export function getTerminalFirebase(): TerminalFirebase {
  if (terminalServices) return terminalServices;
  const env = readEnv();
  const app = initializeApp(webConfig(env), 'terminal');
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
  const db = initializeFirestore(app, {});
  if (env.VITE_USE_EMULATORS) {
    const host = env.VITE_EMULATOR_HOST;
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
  }
  terminalServices = { auth, db };
  return terminalServices;
}
