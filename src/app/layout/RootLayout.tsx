import { ArrowLeftRight, Lock, LogOut, Moon, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useCurrentUser, useSignOut } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { hasPermission, useCurrentMember } from '@/features/users';
import { useOnlineStatus, useSyncSummary } from '@/shared/hooks/useSyncSummary';
import { t } from '@/shared/lib/i18n';
import { AppShell, AppSidebar, Logo, TopBar, type NavSection } from '@/shared/ui';
import { useThemeStore } from '../providers/theme';
import { NAVIGATION } from './navigation';
import { UpdatePrompt } from './UpdatePrompt';

/** Layout de la app autenticada: navegación filtrada por permisos y módulos, barra superior y avisos. */
export function RootLayout() {
  const user = useCurrentUser();
  const member = useCurrentMember();
  const { business, modules } = useActiveBusiness();
  const sync = useSyncSummary();
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { theme, cycle } = useThemeStore();
  const [navOpen, setNavOpen] = useState(false);

  const sections: NavSection[] = NAVIGATION.map((group) => ({
    id: group.id,
    label: group.label ? t(group.label) : undefined,
    items: group.items
      .filter(
        (item) =>
          (!item.permission || hasPermission(member, item.permission)) &&
          (!item.module || modules[item.module]),
      )
      .map((item) => ({ to: item.to, label: t(item.label), icon: item.icon, end: item.end })),
  })).filter((section) => section.items.length > 0);

  return (
    <AppShell
      mobileNavOpen={navOpen}
      onMobileNavOpenChange={setNavOpen}
      sidebar={
        <AppSidebar
          brand={<Logo />}
          sections={sections}
          onNavigate={() => {
            setNavOpen(false);
          }}
        />
      }
      topBar={
        <TopBar
          businessName={business.name}
          user={{ name: user.displayName, email: user.email }}
          sync={sync}
          onMenuClick={() => {
            setNavOpen(true);
          }}
          userMenuItems={[
            {
              id: 'lock',
              label: t('user.lock'),
              icon: <Lock />,
              onSelect: () => void navigate('/lock'),
            },
            {
              id: 'switch',
              label: t('user.switchBusiness'),
              icon: <ArrowLeftRight />,
              onSelect: () => void navigate('/select-business'),
            },
            ...(user.platformAdmin
              ? [
                  {
                    id: 'platform',
                    label: t('platform.openAdmin'),
                    icon: <ShieldCheck />,
                    onSelect: () => void navigate('/platform'),
                  },
                ]
              : []),
            {
              id: 'theme',
              label: t('user.theme', { theme: t(`theme.${theme}`) }),
              icon: <Moon />,
              onSelect: cycle,
            },
            {
              id: 'logout',
              label: t('user.logout'),
              icon: <LogOut />,
              tone: 'danger',
              onSelect: () => {
                signOut.mutate(undefined, {
                  onSuccess: () => void navigate('/login', { replace: true }),
                });
              },
            },
          ]}
        />
      }
      banner={
        <>
          <UpdatePrompt />
          {online ? null : (
            <p
              role="status"
              className="border-b border-border bg-warning-soft px-4 py-2 text-sm text-warning-soft-fg"
            >
              {t('app.offlineBanner')}
            </p>
          )}
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}
