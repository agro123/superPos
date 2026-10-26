import { CloudOff, TriangleAlert } from 'lucide-react';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState, Logo, Spinner } from '@/shared/ui';

/** Pantalla completa de carga. */
export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg">
      <Logo />
      <Spinner size="lg" label={t('app.loading')} />
    </div>
  );
}

/** Pantalla completa de error, con reintento. */
export function FullScreenError({
  offline = false,
  onRetry,
}: {
  offline?: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <EmptyState
        tone={offline ? 'neutral' : 'danger'}
        icon={offline ? <CloudOff /> : <TriangleAlert />}
        title={t('common.loadError')}
        description={offline ? t('common.offlineNoCache') : undefined}
        action={<Button onClick={onRetry}>{t('common.retry')}</Button>}
      />
    </div>
  );
}
