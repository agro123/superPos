import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { INITIAL_LOCKOUT, type LockoutState } from '@/features/auth';
import { idbStorage } from '@/shared/infrastructure/offline/idbStorage';

/** Vinculación vigente de esta instalación con un negocio. */
export interface TerminalLink {
  businessId: string;
  /** Uid anónimo del terminal = id de `posTerminals`. */
  terminalId: string;
}

/** Sesión de trabajo en curso en este terminal. */
export interface WorkerSession {
  sessionId: string;
  businessId: string;
  terminalId: string;
  memberUid: string;
  idleLockMinutes: number;
}

interface TerminalState {
  /** UUID de la instalación de la PWA (no del aparato): se genera en el primer uso. */
  deviceUuid: string | null;
  /** Código del QR en curso (solo en este dispositivo; en Firestore va su hash). */
  pairingCode: string | null;
  link: TerminalLink | null;
  session: WorkerSession | null;
  /** Intentos fallidos por trabajador en este terminal (bloqueo temporal). */
  lockouts: Record<string, LockoutState>;
  ensureDeviceUuid: () => string;
  setPairingCode: (code: string | null) => void;
  setLink: (link: TerminalLink | null) => void;
  setSession: (session: WorkerSession | null) => void;
  setLockout: (memberUid: string, state: LockoutState) => void;
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      deviceUuid: null,
      pairingCode: null,
      link: null,
      session: null,
      lockouts: {},
      ensureDeviceUuid: () => {
        const current = get().deviceUuid;
        if (current) return current;
        const uuid = crypto.randomUUID();
        set({ deviceUuid: uuid });
        return uuid;
      },
      setPairingCode: (pairingCode) => {
        set({ pairingCode });
      },
      setLink: (link) => {
        set({ link });
      },
      setSession: (session) => {
        set({ session });
      },
      setLockout: (memberUid, state) => {
        set((current) => ({
          lockouts: { ...current.lockouts, [memberUid]: state },
        }));
      },
    }),
    { name: 'superpos.terminal', storage: createJSONStorage(() => idbStorage), version: 1 },
  ),
);

export const lockoutOf = (lockouts: Record<string, LockoutState>, memberUid: string) =>
  lockouts[memberUid] ?? INITIAL_LOCKOUT;
