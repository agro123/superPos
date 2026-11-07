import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser, useSignIn, useSignOut } from '@/features/auth';
import { useActiveBusinessStore } from '@/features/business';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { logger } from '@/shared/lib/logger';
import { isIdle } from '../domain/session';
import type { PosTerminal } from '../domain/terminal';
import type { TerminalWorker } from '../domain/worker';
import { watchTerminalWorkers } from '../infrastructure/terminalDevice';
import {
  closeWorkerSession,
  startWorkerSession,
  watchSessionTerminal,
} from '../infrastructure/workerSession';
import { useTerminalStore, type WorkerSession } from './terminalStore';

/** Tiempo máximo esperando el cierre de la sesión en el servidor antes de cerrar Auth. */
const CLOSE_TIMEOUT_MS = 4000;

export const useTerminalWorkers = (bid: string) =>
  useLiveQuery(['terminalWorkers', bid], watchTerminalWorkers(bid));

/** Sesión de trabajo de este terminal para el usuario actual, si la hay. */
export function useWorkerSession(): WorkerSession | null {
  const session = useTerminalStore((state) => state.session);
  const user = useCurrentUser();
  return session?.memberUid === user.uid ? session : null;
}

/** Login del trabajador en el terminal: Firebase Auth individual + sesión de trabajo registrada. */
export function useWorkerLogin(terminal: PosTerminal, businessId: string) {
  const signIn = useSignIn();
  const setActive = useActiveBusinessStore((state) => state.setActive);
  const setSession = useTerminalStore((state) => state.setSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({ worker, password }: { worker: TerminalWorker; password: string }) => {
      // Sin datos del trabajador anterior en caché.
      queryClient.removeQueries({
        predicate: (q) => !String(q.queryKey[0]).startsWith('terminal'),
      });
      const uid = await signIn.mutateAsync({ email: worker.email, password });
      setActive(uid, businessId);
      const sessionId = startWorkerSession(businessId, terminal.id, uid);
      setSession({
        sessionId,
        businessId,
        terminalId: terminal.id,
        memberUid: uid,
        idleLockMinutes: terminal.idleLockMinutes,
      });
      return uid;
    },
    onSuccess: () => void navigate('/pos', { replace: true }),
  });
}

/** Cierra la sesión de trabajo y la de Auth, limpia la caché y vuelve a la selección. */
export function useEndWorkerSession() {
  const signOut = useSignOut();
  const setSession = useTerminalStore((state) => state.setSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    const session = useTerminalStore.getState().session;
    if (session) {
      // Debe llegar al servidor antes del signOut; sin red queda abierta (el admin puede expirarla).
      await Promise.race([
        closeWorkerSession(session.businessId, session.sessionId),
        new Promise((resolve) => setTimeout(resolve, CLOSE_TIMEOUT_MS)),
      ]).catch((error: unknown) => {
        logger.warn('No se pudo cerrar la sesión de trabajo', { error });
      });
    }
    setSession(null);
    await signOut.mutateAsync();
    queryClient.clear();
    void navigate('/terminal', { replace: true });
  };
}

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

/**
 * En un terminal: cierra la sesión del trabajador tras la inactividad configurada o si el admin
 * desactiva/revoca el terminal. Las reglas ya rechazan las ventas de un terminal no activo; esto
 * evita que el trabajador siga operando en la interfaz.
 */
export function useTerminalSessionGuard(): void {
  const session = useWorkerSession();
  const end = useEndWorkerSession();
  const endRef = useRef(end);
  useEffect(() => {
    endRef.current = end;
  });
  const terminal = useLiveQuery(
    ['sessionTerminal', session?.businessId, session?.terminalId],
    session ? watchSessionTerminal(session.businessId, session.terminalId) : null,
  );
  const status = terminal.data?.value?.status;

  useEffect(() => {
    if (session && status && status !== 'active') void endRef.current();
  }, [session, status]);

  useEffect(() => {
    if (!session) return;
    let last = Date.now();
    const onActivity = () => {
      last = Date.now();
    };
    for (const event of ACTIVITY_EVENTS)
      window.addEventListener(event, onActivity, { passive: true });
    const timer = setInterval(() => {
      if (isIdle(last, Date.now(), session.idleLockMinutes)) void endRef.current();
    }, 15_000);
    return () => {
      clearInterval(timer);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity);
    };
  }, [session]);
}
