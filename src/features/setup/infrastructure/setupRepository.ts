import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { LiveDoc, Subscribe } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, updateAudit, watchDoc } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import {
  setupStateSchema,
  tourProgressSchema,
  type SetupProgressFields,
  type SetupState,
  type TourProgress,
} from '../domain/setup';

const db = () => getFirebase().db;
const setupRef = (bid: string) => doc(db(), 'businesses', bid, 'settings', 'setup');
const tourRef = (bid: string, uid: string) => doc(db(), 'businesses', bid, 'tourProgress', uid);

export const watchSetup = (bid: string): Subscribe<LiveDoc<SetupState>> =>
  watchDoc(setupRef(bid).withConverter(zodConverter(setupStateSchema)));

export const watchTourProgress = (bid: string, uid: string): Subscribe<LiveDoc<TourProgress>> =>
  watchDoc(tourRef(bid, uid).withConverter(zodConverter(tourProgressSchema)));

export type SetupChange = Pick<SetupProgressFields, 'completedSteps' | 'skippedSteps'> & {
  dismiss?: boolean;
  complete?: boolean;
};

/** Guarda el avance (sin esperar: funciona sin conexión). */
export function saveSetup(bid: string, change: SetupChange): void {
  trackWrite(
    updateDoc(setupRef(bid), {
      completedSteps: change.completedSteps,
      skippedSteps: change.skippedSteps,
      ...(change.dismiss ? { dismissedAt: serverTimestamp() } : {}),
      ...(change.complete ? { completedAt: serverTimestamp() } : {}),
      ...updateAudit(),
    }),
    'setup.progress',
  );
}

export function markTour(
  bid: string,
  uid: string,
  status: TourProgress['status'],
  exists: boolean,
): void {
  trackWrite(
    setDoc(
      tourRef(bid, uid),
      { status, ...(exists ? updateAudit() : createAudit(uid)) },
      { merge: exists },
    ),
    'setup.tour',
  );
}
