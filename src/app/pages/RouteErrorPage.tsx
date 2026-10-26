import { TriangleAlert } from 'lucide-react';
import { useRouteError } from 'react-router';
import { errorMessage } from '@/shared/lib/errorMessage';
import { logger } from '@/shared/lib/logger';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState } from '@/shared/ui';

/** Error no controlado en una ruta (incluye fallos al cargar un chunk sin conexión). */
export function RouteErrorPage() {
  const error = useRouteError();
  logger.error(`Error de ruta: ${error instanceof Error ? error.message : String(error)}`);
  return (
    <main id="main-content" className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <EmptyState
        tone="danger"
        icon={<TriangleAlert />}
        title={t('common.loadError')}
        description={errorMessage(error)}
        action={
          <Button
            onClick={() => {
              window.location.reload();
            }}
          >
            {t('common.retry')}
          </Button>
        }
      />
    </main>
  );
}
