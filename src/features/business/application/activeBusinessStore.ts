import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ActiveBusinessState {
  /** Negocio activo por usuario en este dispositivo. */
  byUser: Record<string, string>;
  setActive: (uid: string, businessId: string) => void;
  clear: (uid: string) => void;
}

/** Preferencia local (no es autorización: la pertenencia la validan las reglas). */
export const useActiveBusinessStore = create<ActiveBusinessState>()(
  persist(
    (set) => ({
      byUser: {},
      setActive: (uid, businessId) => {
        set((state) => ({ byUser: { ...state.byUser, [uid]: businessId } }));
      },
      clear: (uid) => {
        set((state) => ({
          byUser: Object.fromEntries(Object.entries(state.byUser).filter(([key]) => key !== uid)),
        }));
      },
    }),
    { name: 'superpos.activeBusiness', storage: createJSONStorage(() => localStorage) },
  ),
);

export function useActiveBusinessId(uid: string): string | null {
  return useActiveBusinessStore((state) => state.byUser[uid] ?? null);
}
