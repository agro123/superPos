import {
  Building2,
  CreditCard,
  MonitorSmartphone,
  Percent,
  Puzzle,
  Store,
  Users,
} from 'lucide-react';
import { Outlet } from 'react-router';
import { usePermission } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { PageHeader, SettingsLayout } from '@/shared/ui';

export default function SettingsLayoutPage() {
  const canManageUsers = usePermission('users.manage');
  const items = [
    { to: '/settings/business', label: t('settings.business'), icon: <Building2 /> },
    { to: '/settings/modules', label: t('settings.modules'), icon: <Puzzle /> },
    { to: '/settings/taxes', label: t('settings.taxes'), icon: <Percent /> },
    { to: '/settings/payments', label: t('settings.payments'), icon: <CreditCard /> },
    { to: '/settings/storefront', label: t('storefront.title'), icon: <Store /> },
    ...(canManageUsers
      ? [
          { to: '/settings/employees', label: t('settings.employees'), icon: <Users /> },
          {
            to: '/settings/terminals',
            label: t('terminals.title'),
            icon: <MonitorSmartphone />,
          },
        ]
      : []),
  ];
  return (
    <SettingsLayout
      header={<PageHeader title={t('settings.title')} description={t('settings.description')} />}
      items={items}
    >
      <Outlet />
    </SettingsLayout>
  );
}
