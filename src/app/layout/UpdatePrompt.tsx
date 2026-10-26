import { RefreshCw } from 'lucide-react';
import { t } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';
import { usePwaStore } from '../pwa';

/** Aviso de "nueva versión disponible": el usuario decide cuándo recargar. */
export function UpdatePrompt() {
  const needRefresh = usePwaStore((state) => state.needRefresh);
  const update = usePwaStore((state) => state.update);
  if (!needRefresh) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border-b border-border bg-info-soft px-4 py-2 text-sm text-info-soft-fg"
    >
      <span>{t('app.updateAvailable')}</span>
      <Button size="sm" leftIcon={<RefreshCw aria-hidden className="size-4" />} onClick={update}>
        {t('app.update')}
      </Button>
    </div>
  );
}
