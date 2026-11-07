import { signInAnonymously } from 'firebase/auth';
import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { LiveDoc, Subscribe, Synced } from '@/shared/domain/live';
import { getTerminalFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { mapFirebaseError } from '@/shared/infrastructure/firebase/errors';
import { watchDoc, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { pairingRequestSchema, type PairingRequest } from '../domain/pairing';
import { posTerminalSchema, type DeviceType, type PosTerminal } from '../domain/terminal';
import { terminalWorkerSchema, type TerminalWorker } from '../domain/worker';

// Lado del terminal: todo va por la instancia `terminal` (identidad anónima de la instalación).
const db = () => getTerminalFirebase().db;
const requestConverter = zodConverter(pairingRequestSchema);
const terminalConverter = zodConverter(posTerminalSchema);
const workerConverter = zodConverter(terminalWorkerSchema);

async function run<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

/** Uid anónimo de esta instalación; lo crea la primera vez (requiere conexión). */
export function ensureTerminalIdentity(): Promise<string> {
  return run(async () => {
    const { auth } = getTerminalFirebase();
    await auth.authStateReady();
    if (auth.currentUser) return auth.currentUser.uid;
    const credential = await signInAnonymously(auth);
    return credential.user.uid;
  });
}

/** Crea la solicitud de vinculación. Se espera: el QR solo sirve si la solicitud ya existe. */
export function createPairingRequest(
  requestId: string,
  deviceUid: string,
  deviceUuid: string,
  deviceType: DeviceType,
): Promise<void> {
  return run(() =>
    setDoc(doc(db(), 'terminalPairingRequests', requestId), {
      deviceUid,
      deviceUuid,
      deviceType,
      status: 'pending',
      businessId: null,
      approvedBy: null,
      approvedAt: null,
      createdAt: serverTimestamp(),
    }),
  );
}

export function cancelPairingRequest(requestId: string): Promise<void> {
  return run(() =>
    updateDoc(doc(db(), 'terminalPairingRequests', requestId), { status: 'cancelled' }),
  );
}

export const watchPairingRequest = (requestId: string): Subscribe<LiveDoc<PairingRequest>> =>
  watchDoc(doc(db(), 'terminalPairingRequests', requestId).withConverter(requestConverter));

export const watchOwnTerminal = (bid: string, uid: string): Subscribe<LiveDoc<PosTerminal>> =>
  watchDoc(doc(db(), 'businesses', bid, 'posTerminals', uid).withConverter(terminalConverter));

export const watchTerminalWorkers = (bid: string): Subscribe<Synced<TerminalWorker>[]> =>
  watchQuery(collection(db(), 'businesses', bid, 'members').withConverter(workerConverter));

/** Última actividad conocida del terminal (informativa; si falla no bloquea nada). */
export function touchTerminal(bid: string, uid: string): void {
  void updateDoc(doc(db(), 'businesses', bid, 'posTerminals', uid), {
    lastSeenAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);
}
