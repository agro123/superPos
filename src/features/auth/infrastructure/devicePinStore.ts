import { idbStorage } from '@/shared/infrastructure/offline/idbStorage';
import type { PinRecord, PinStore } from '../domain/pin';

const key = (uid: string) => `pin:${uid}`;

/** PIN derivado guardado solo en este dispositivo (IndexedDB), nunca en Firestore (ADR 0008). */
export const devicePinStore: PinStore = {
  async get(uid) {
    const raw = await idbStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as PinRecord) : null;
  },
  async set(uid, record) {
    await idbStorage.setItem(key(uid), JSON.stringify(record));
  },
  async remove(uid) {
    await idbStorage.removeItem(key(uid));
  },
};
