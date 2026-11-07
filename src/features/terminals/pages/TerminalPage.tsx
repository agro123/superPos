import { MonitorSmartphone, ShieldOff, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState, Logo, Skeleton } from '@/shared/ui';
import { useTerminalDevice } from '../application/useTerminalDevice';
import { PairingPanel } from '../ui/PairingPanel';
import { WorkerSelection } from '../ui/WorkerSelection';

/** Pantalla del terminal POS: vinculación por QR y selección de trabajador. */
export default function TerminalPage() {
  const { view, startPairing } = useTerminalDevice();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const pair = () => {
    setBusy(true);
    startPairing()
      .catch((error: unknown) => {
        toast({ title: t('terminal.loadError'), description: String(error), tone: 'danger' });
      })
      .finally(() => {
        setBusy(false);
      });
  };
  const register = (
    <Button size="lg" loading={busy} onClick={pair}>
      {busy ? t('terminal.registering') : t('terminal.register')}
    </Button>
  );

  let content;
  if (view.kind === 'loading') content = <Skeleton className="h-64 w-full" />;
  else if (view.kind === 'error')
    content = (
      <EmptyState
        icon={<WifiOff />}
        title={t('terminal.loadError')}
        description={t('terminal.loadErrorHint')}
        action={<Button onClick={view.retry}>{t('common.retry')}</Button>}
      />
    );
  else if (view.kind === 'unregistered')
    content = (
      <EmptyState
        icon={<MonitorSmartphone />}
        title={t('terminal.unauthorized')}
        description={t('terminal.unauthorizedHint')}
        action={register}
      />
    );
  else if (view.kind === 'pairing')
    content = (
      <PairingPanel
        code={view.code}
        state={view.state}
        expiresAt={view.expiresAt}
        now={view.now}
        renewing={busy}
        onRenew={pair}
      />
    );
  else if (view.terminal.status === 'active')
    content = <WorkerSelection terminal={view.terminal} businessId={view.businessId} />;
  else
    content = (
      <EmptyState
        icon={<ShieldOff />}
        title={view.terminal.status === 'revoked' ? t('terminal.revoked') : t('terminal.disabled')}
        description={
          view.terminal.status === 'revoked'
            ? t('terminal.revokedHint')
            : t('terminal.disabledHint')
        }
        action={view.terminal.status === 'revoked' ? register : undefined}
      />
    );

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Logo />
        <Link to="/login" className="text-sm font-medium text-primary hover:underline">
          {t('terminal.adminAccess')}
        </Link>
      </header>
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center p-4 md:p-6"
      >
        <h1 className="sr-only">{t('terminal.title')}</h1>
        {content}
      </main>
    </div>
  );
}
