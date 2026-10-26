import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '@/shared/infrastructure/offline/idbStorage';

interface SaleSequenceState {
  /** Última secuencia usada por código de dispositivo (ADR 0006). */
  last: Record<string, number>;
  next: (deviceCode: string) => number;
}

/** Secuencia local de numeración de ventas, persistida en IndexedDB. */
export const useSaleSequenceStore = create<SaleSequenceState>()(
  persist(
    (set, get) => ({
      last: {},
      next: (deviceCode) => {
        const value = (get().last[deviceCode] ?? 0) + 1;
        set((state) => ({ last: { ...state.last, [deviceCode]: value } }));
        return value;
      },
    }),
    { name: 'superpos.saleSequence', storage: createJSONStorage(() => idbStorage), version: 1 },
  ),
);
