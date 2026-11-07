import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import {
  generatePairingCode,
  normalizePairingCode,
  pairingExpiresAt,
  pairingStateOf,
  type PairingState,
} from '../domain/pairing';
import { detectDeviceType, type PosTerminal } from '../domain/terminal';
import {
  cancelPairingRequest,
  createPairingRequest,
  ensureTerminalIdentity,
  touchTerminal,
  watchOwnTerminal,
  watchPairingRequest,
} from '../infrastructure/terminalDevice';
import { sha256Hex } from './hashing';
import { useTerminalStore } from './terminalStore';

function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useTerminalStore.persist.onFinishHydration(onChange),
    () => useTerminalStore.persist.hasHydrated(),
  );
}

/** Hash del código guardado (id de la solicitud). */
function usePairingRequestId(code: string | null): string | null {
  const normalized = code ? normalizePairingCode(code) : null;
  const hash = useQuery({
    queryKey: ['terminalPairingHash', normalized],
    queryFn: () => sha256Hex(normalized ?? ''),
    enabled: normalized !== null,
    staleTime: Infinity,
  });
  return normalized ? (hash.data ?? null) : null;
}

/** Re-renderiza cada segundo mientras `active` (cuenta regresiva del QR). */
function useNow(active: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [active]);
  return now;
}

export type TerminalDeviceView =
  | { kind: 'loading' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'unregistered' }
  | { kind: 'pairing'; code: string; state: PairingState; expiresAt: Date | null; now: Date }
  | { kind: 'linked'; terminal: PosTerminal; businessId: string };

/**
 * Estado de esta instalación como terminal: identidad anónima, solicitud de vinculación (QR) y
 * autorización. Al aprobarse la solicitud, guarda el vínculo con el negocio.
 */
export function useTerminalDevice() {
  const hydrated = useHydrated();
  const { pairingCode, link, ensureDeviceUuid, setPairingCode, setLink } = useTerminalStore();
  const identity = useQuery({
    queryKey: ['terminalIdentity'],
    queryFn: ensureTerminalIdentity,
    staleTime: Infinity,
    enabled: hydrated,
  });
  const uid = identity.data ?? null;
  const requestId = usePairingRequestId(pairingCode);
  const request = useLiveQuery(
    ['pairingRequest', requestId],
    uid && requestId ? watchPairingRequest(requestId) : null,
  );
  const terminal = useLiveQuery(
    ['ownTerminal', link?.businessId, uid],
    uid && link ? watchOwnTerminal(link.businessId, uid) : null,
  );
  const pairing = request.data?.value ?? null;
  const now = useNow(pairing?.status === 'pending');

  useEffect(() => {
    if (pairing?.status === 'approved' && pairing.businessId && uid) {
      setLink({ businessId: pairing.businessId, terminalId: uid });
      setPairingCode(null);
    }
  }, [pairing, uid, setLink, setPairingCode]);

  const linkedTerminal = terminal.data?.value ?? null;
  useEffect(() => {
    if (link && linkedTerminal?.status === 'active')
      touchTerminal(link.businessId, link.terminalId);
  }, [link, linkedTerminal?.status]);

  /** Genera un QR nuevo (y cancela el anterior si seguía pendiente). */
  const startPairing = async () => {
    const deviceUid = uid ?? (await ensureTerminalIdentity());
    if (requestId && pairing?.status === 'pending') {
      await cancelPairingRequest(requestId).catch(() => undefined);
    }
    const code = generatePairingCode((length) => crypto.getRandomValues(new Uint8Array(length)));
    const id = await sha256Hex(normalizePairingCode(code) ?? code);
    const deviceType = detectDeviceType({
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
    });
    await createPairingRequest(id, deviceUid, ensureDeviceUuid(), deviceType);
    setLink(null);
    setPairingCode(code);
  };

  let view: TerminalDeviceView;
  if (!hydrated || identity.isPending) view = { kind: 'loading' };
  else if (identity.isError || terminal.isError)
    view = {
      kind: 'error',
      retry: () => {
        void identity.refetch();
        void terminal.refetch();
      },
    };
  else if (link && linkedTerminal)
    view = { kind: 'linked', terminal: linkedTerminal, businessId: link.businessId };
  else if (link && terminal.isPending) view = { kind: 'loading' };
  else if (pairingCode)
    view = {
      kind: 'pairing',
      code: pairingCode,
      state: pairing ? pairingStateOf(pairing, now) : 'pending',
      expiresAt: pairing ? pairingExpiresAt(pairing) : null,
      now,
    };
  else view = { kind: 'unregistered' };

  return { view, startPairing };
}
