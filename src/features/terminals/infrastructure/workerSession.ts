import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { LiveDoc, Subscribe } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, updateAudit, watchDoc } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import { posTerminalSchema, type PosTerminal } from '../domain/terminal';

// Sesión del trabajador: instancia principal, escrita con la identidad del propio trabajador.
const db = () => getFirebase().db;
const terminalConverter = zodConverter(posTerminalSchema);

/** Abre la sesión de trabajo (id generado en cliente). */
export function startWorkerSession(bid: string, terminalId: string, uid: string): string {
  const ref = doc(collection(db(), 'businesses', bid, 'terminalSessions'));
  trackWrite(
    setDoc(ref, {
      terminalId,
      memberUid: uid,
      loginMethod: 'password',
      status: 'active',
      startedAt: serverTimestamp(),
      endedAt: null,
      lastActivityAt: serverTimestamp(),
      ...createAudit(uid),
    }),
    'terminalSessions.start',
  );
  return ref.id;
}

/**
 * Cierra la sesión. Devuelve la promesa porque debe confirmarse antes de cerrar la sesión de
 * Firebase Auth: después ya no habría credenciales para escribir.
 */
export function closeWorkerSession(bid: string, sessionId: string): Promise<void> {
  return updateDoc(doc(db(), 'businesses', bid, 'terminalSessions', sessionId), {
    status: 'closed',
    endedAt: serverTimestamp(),
    ...updateAudit(),
  });
}

/** Estado del terminal visto por el trabajador (para salir si lo revocan). */
export const watchSessionTerminal = (
  bid: string,
  terminalId: string,
): Subscribe<LiveDoc<PosTerminal>> =>
  watchDoc(
    doc(db(), 'businesses', bid, 'posTerminals', terminalId).withConverter(terminalConverter),
  );
