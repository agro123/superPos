import { openDB, type IDBPDatabase } from 'idb';
import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'superpos-drafts';
const STORE = 'kv';

let dbPromise: Promise<IDBPDatabase> | null = null;

function database(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
  return dbPromise;
}

/**
 * Almacenamiento IndexedDB para el middleware `persist` de Zustand: borradores (carrito,
 * formularios largos) que sobreviven a recargas y cierres. No guardar aquí datos sensibles.
 */
export const idbStorage: StateStorage = {
  async getItem(name) {
    const value: unknown = await (await database()).get(STORE, name);
    return typeof value === 'string' ? value : null;
  },
  async setItem(name, value) {
    await (await database()).put(STORE, value, name);
  },
  async removeItem(name) {
    await (await database()).delete(STORE, name);
  },
};
