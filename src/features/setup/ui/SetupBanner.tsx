import { Rocket } from 'lucide-react';
import { Link } from 'react-router';
import { usePermission } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { useSetup } from '../application/useSetup';
import { setupProgress } from '../domain/setup';

/** Aviso en Inicio mientras la configuración inicial no esté terminada. */
export function SetupBanner() {
  const { state } = useSetup();
  const canManage = usePermission('settings.manage');
  if (!canManage || !state || state.completedAt) return null;
  const progress = setupProgress(state);
  return (
    <section
      aria-labelledby="setup-banner"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary bg-primary-soft p-4 text-primary-soft-fg"
    >
      <div className="flex items-center gap-3">
        <Rocket aria-hidden className="size-6" />
        <div>
          <h2 id="setup-banner" className="font-semibold">
            {t('setup.banner.title', { percent: String(progress.percent) })}
          </h2>
          <p className="text-sm">
            {t('setup.banner.hint', { done: String(progress.done), total: String(progress.total) })}
          </p>
        </div>
      </div>
      <Link
        to="/setup"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
      >
        {t('setup.banner.cta')}
      </Link>
    </section>
  );
}
