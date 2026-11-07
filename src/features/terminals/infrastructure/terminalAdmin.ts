import {
  collection,
  doc,
  getDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { mapFirebaseError } from '@/shared/infrastructure/firebase/errors';
import { createAudit, updateAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import { pairingRequestSchema, type PairingRequest } from '../domain/pairing';
import { terminalSessionSchema, type TerminalSession } from '../domain/session';
import {
  posTerminalSchema,
  type PosTerminal,
  type TerminalStatus,
  type TerminalUpdate,
} from '../domain/terminal';
import { terminalWorkerSchema, type TerminalWorker } from '../domain/worker';

// Lado del administrador: instancia principal (sesión del admin).
const db = () => getFirebase().db;
const requestConverter = zodConverter(pairingRequestSchema);
const terminalConverter = zodConverter(posTerminalSchema);
const sessionConverter = zodConverter(terminalSessionSchema);
const workerConverter = zodConverter(terminalWorkerSchema);
const terminalsCol = (bid: string) => collection(db(), 'businesses', bid, 'posTerminals');

/** Busca la solicitud por el hash del código (requiere conexión: valida vigencia en el servidor). */
export async function findPairingRequest(requestId: string): Promise<PairingRequest | null> {
  try {
    const snapshot = await getDoc(
      doc(db(), 'terminalPairingRequests', requestId).withConverter(requestConverter),
    );
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export interface ApprovePairingInput {
  businessId: string;
  request: PairingRequest;
  update: TerminalUpdate;
  uid: string;
}

/**
 * Aprueba la solicitud y crea (o reactiva, si estaba revocado) el terminal en un solo batch: las
 * reglas exigen ambas escrituras juntas. Se espera la confirmación del servidor porque la solicitud
 * vence en minutos y un fallo debe verse de inmediato.
 */
export async function approvePairing({ businessId, request, update, uid }: ApprovePairingInput) {
  try {
    const terminalRef = doc(terminalsCol(businessId), request.deviceUid);
    const existing = await getDoc(terminalRef);
    const batch = writeBatch(db());
    batch.update(doc(db(), 'terminalPairingRequests', request.id), {
      status: 'approved',
      businessId,
      approvedBy: uid,
      approvedAt: serverTimestamp(),
    });
    const pairing = {
      deviceType: request.deviceType,
      name: update.name,
      status: 'active',
      idleLockMinutes: update.idleLockMinutes,
      pairingRequestId: request.id,
      registeredBy: uid,
      authorizedAt: serverTimestamp(),
      revokedAt: null,
    };
    if (existing.exists()) {
      batch.update(terminalRef, { ...pairing, ...updateAudit() });
    } else {
      batch.set(terminalRef, {
        ...pairing,
        deviceUuid: request.deviceUuid,
        lastSeenAt: null,
        ...createAudit(uid),
      });
    }
    await batch.commit();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export const watchTerminals = (bid: string): Subscribe<Synced<PosTerminal>[]> =>
  watchQuery(query(terminalsCol(bid), orderBy('name')).withConverter(terminalConverter));

export function updateTerminal(bid: string, terminalId: string, update: TerminalUpdate): void {
  trackWrite(
    updateDoc(doc(terminalsCol(bid), terminalId), { ...update, ...updateAudit() }),
    'terminals.update',
  );
}

export function setTerminalStatus(bid: string, terminalId: string, status: TerminalStatus): void {
  trackWrite(
    updateDoc(doc(terminalsCol(bid), terminalId), {
      status,
      ...(status === 'revoked' ? { revokedAt: serverTimestamp() } : {}),
      ...updateAudit(),
    }),
    'terminals.status',
  );
}

export const watchRecentSessions = (bid: string): Subscribe<Synced<TerminalSession>[]> =>
  watchQuery(
    query(
      collection(db(), 'businesses', bid, 'terminalSessions'),
      orderBy('startedAt', 'desc'),
      limit(50),
    ).withConverter(sessionConverter),
  );

/** El admin cierra (expira) una sesión que quedó abierta. */
export function expireSession(bid: string, sessionId: string): void {
  trackWrite(
    updateDoc(doc(db(), 'businesses', bid, 'terminalSessions', sessionId), {
      status: 'expired',
      endedAt: serverTimestamp(),
      ...updateAudit(),
    }),
    'terminalSessions.expire',
  );
}

/** Nombres de los miembros para el historial de sesiones. */
export const watchMemberNames = (bid: string): Subscribe<Synced<TerminalWorker>[]> =>
  watchQuery(collection(db(), 'businesses', bid, 'members').withConverter(workerConverter));
