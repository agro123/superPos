import { ShieldX } from 'lucide-react';
import { Outlet } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { t } from '@/shared/lib/i18n';
import { EmptyState } from '@/shared/ui';

/** Solo super administradores (claim `platformAdmin`). Es UX: las reglas validan el claim. */
export function RequirePlatformAdmin() {
  if (useCurrentUser().platformAdmin) return <Outlet />;
  return (
    <main id="main-content" className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <EmptyState
        icon={<ShieldX />}
        title={t('access.deniedTitle')}
        description={t('platform.deniedHint')}
      />
    </main>
  );
}
