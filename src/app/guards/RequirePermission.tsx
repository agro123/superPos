import { ShieldX } from 'lucide-react';
import { Outlet } from 'react-router';
import { useActiveBusiness, type ModuleId } from '@/features/business';
import { usePermission, type Permission } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { EmptyState } from '@/shared/ui';
import { NotFoundPage } from '../pages/NotFoundPage';

/** Guarda de ruta por permiso. Es UX: las Security Rules son la barrera real. */
export function RequirePermission({ permission }: { permission: Permission }) {
  if (usePermission(permission)) return <Outlet />;
  return (
    <EmptyState
      className="min-h-[60dvh]"
      icon={<ShieldX />}
      title={t('access.deniedTitle')}
      description={t('access.deniedHint', { permission: t(`permission.${permission}`) })}
    />
  );
}

/** Rutas de un módulo activable: si el módulo está apagado, la ruta no existe. */
export function RequireModule({ module }: { module: ModuleId }) {
  return useActiveBusiness().modules[module] ? <Outlet /> : <NotFoundPage />;
}
