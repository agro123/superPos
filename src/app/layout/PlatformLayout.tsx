import { Building2, LogOut, Moon, Store } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useCurrentUser, useSignOut } from '@/features/auth';
import { useOnlineStatus, useSyncSummary } from '@/shared/hooks/useSyncSummary';
import { t } from '@/shared/lib/i18n';
import { AppShell, AppSidebar, Logo, TopBar } from '@/shared/ui';
import { useThemeStore } from '../providers/theme';

/** Layout del super administrador: no depende de un negocio activo. */
export function PlatformLayout() {
  const user = useCurrentUser();
  const sync = useSyncSummary();
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { theme, cycle } = useThemeStore();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <AppShell
      mobileNavOpen={navOpen}
      onMobileNavOpenChange={setNavOpen}
      sidebar={
        <AppSidebar
          brand={<Logo />}
          sections={[
            {
              id: 'platform',
              items: [
                { to: '/platform', label: t('platform.nav.businesses'), icon: <Building2 /> },
              ],
            },
          ]}
          onNavigate={() => {
            setNavOpen(false);
          }}
        />
      }
      topBar={
        <TopBar
          businessName={t('platform.shellTitle')}
          user={{ name: user.displayName, email: user.email }}
          sync={sync}
          onMenuClick={() => {
            setNavOpen(true);
          }}
          userMenuItems={[
            {
              id: 'app',
              label: t('platform.backToApp'),
              icon: <Store />,
              onSelect: () => void navigate('/select-business'),
            },
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
        online ? null : (
          <p
            role="status"
            className="border-b border-border bg-warning-soft px-4 py-2 text-sm text-warning-soft-fg"
          >
            {t('app.offlineBanner')}
          </p>
        )
      }
    >
      <Outlet />
    </AppShell>
  );
}
