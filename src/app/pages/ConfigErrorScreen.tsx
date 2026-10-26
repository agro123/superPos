import { TriangleAlert } from 'lucide-react';
import { toAppError } from '@/shared/domain/errors';
import { t } from '@/shared/lib/i18n';
import { EmptyState } from '@/shared/ui';

/** Configuración inválida (variables VITE_* faltantes). Muestra el detalle técnico: no contiene secretos. */
export function ConfigErrorScreen({ error }: { error: unknown }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <EmptyState
        tone="danger"
        icon={<TriangleAlert />}
        title={t('errors.config')}
        description={toAppError(error).message}
      />
    </main>
  );
}
