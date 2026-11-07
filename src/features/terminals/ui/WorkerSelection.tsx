import { useEffect, useState } from 'react';
import { isLocked, registerFailedAttempt, INITIAL_LOCKOUT } from '@/features/auth';
import { t } from '@/shared/lib/i18n';
import { Text } from '@/shared/ui';
import { lockoutOf, useTerminalStore } from '../application/terminalStore';
import { useTerminalWorkers, useWorkerLogin } from '../application/useWorkerSession';
import type { PosTerminal } from '../domain/terminal';
import { selectableWorkers, type TerminalWorker } from '../domain/worker';
import { WorkerLoginForm } from './WorkerLoginForm';
import { WorkerPicker } from './WorkerPicker';

export interface WorkerSelectionProps {
  terminal: PosTerminal;
  businessId: string;
}

/** Terminal activo: elegir perfil y entrar con contraseña, con bloqueo tras intentos fallidos. */
export function WorkerSelection({ terminal, businessId }: WorkerSelectionProps) {
  const workers = useTerminalWorkers(businessId);
  const login = useWorkerLogin(terminal, businessId);
  const { lockouts, setLockout } = useTerminalStore();
  const [selected, setSelected] = useState<TerminalWorker | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lockout = selected ? lockoutOf(lockouts, selected.id) : INITIAL_LOCKOUT;
  const lockedSeconds =
    isLocked(lockout, now) && lockout.lockedUntil
      ? Math.ceil((lockout.lockedUntil - now) / 1000)
      : 0;

  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [lockedSeconds]);

  if (selected) {
    return (
      <WorkerLoginForm
        worker={selected}
        submitting={login.isPending}
        lockedSeconds={lockedSeconds}
        error={
          login.error
            ? login.error.code === 'unauthenticated'
              ? t('terminal.wrongPassword')
              : t(`errors.${login.error.code}`)
            : null
        }
        onBack={() => {
          login.reset();
          setSelected(null);
        }}
        onSubmit={(password) => {
          login.mutate(
            { worker: selected, password },
            {
              onSuccess: () => {
                setLockout(selected.id, INITIAL_LOCKOUT);
              },
              onError: (error) => {
                if (error.code === 'unauthenticated') {
                  const current = Date.now();
                  setLockout(selected.id, registerFailedAttempt(lockout, current));
                  setNow(current);
                }
              },
            },
          );
        }}
      />
    );
  }

  return (
    <section aria-labelledby="pick-worker" className="flex flex-col gap-4">
      <div>
        <h2 id="pick-worker" className="text-xl font-semibold text-text">
          {t('terminal.pickWorker')}
        </h2>
        <Text variant="muted">{terminal.name}</Text>
      </div>
      <WorkerPicker
        workers={selectableWorkers(workers.data ?? [])}
        loading={workers.isPending}
        onPick={setSelected}
      />
    </section>
  );
}
