import {
  ArrowLeftRight,
  Lock,
  LogOut,
  Moon,
  QrCode,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useCurrentUser, useSignOut } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { stockLevelOf, useProducts } from '@/features/catalog';
import { CatalogShareLauncher, useStorefrontSync } from '@/features/storefront';
import {
  useEndWorkerSession,
  useTerminalSessionGuard,
  useWorkerSession,
} from '@/features/terminals';
import { hasPermission, useCurrentMember } from '@/features/users';
import { useOnlineStatus, useSyncSummary } from '@/shared/hooks/useSyncSummary';
import { t } from '@/shared/lib/i18n';
import { AppShell, AppSidebar, BottomNav, Logo, TopBar, type NavSection } from '@/shared/ui';
import { useThemeStore } from '../providers/theme';
import { NAVIGATION, type NavEntry } from './navigation';
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
  const workerSession = useWorkerSession();
  const endWorkerSession = useEndWorkerSession();
  useTerminalSessionGuard();
  // Quien administra el catálogo mantiene publicado el catálogo público mientras usa la app.
  useStorefrontSync(hasPermission(member, 'catalog.manage'));
  const [sharing, setSharing] = useState(false);
  const products = useProducts(business.id);
  const stockAlerts = (products.data ?? []).filter(
    (p) => p.active && ['low', 'out'].includes(stockLevelOf(p)),
  ).length;

  const visible = (item: NavEntry) =>
    (!item.permission || hasPermission(member, item.permission)) &&
    (!item.module || modules[item.module]);
  const toItem = (item: NavEntry) => ({
    to: item.to,
    label: t(item.label),
    icon: item.icon,
    end: item.end,
    ...(item.to === '/inventory'
      ? {
          badge: {
            count: stockAlerts,
            label: t('inventory.alertsBadge', { count: String(stockAlerts) }),
          },
        }
      : {}),
  });
  const sections: NavSection[] = NAVIGATION.map((group) => ({
    id: group.id,
    label: group.label ? t(group.label) : undefined,
    items: group.items.filter(visible).map(toItem),
  })).filter((section) => section.items.length > 0);
  const bottomItems = NAVIGATION.flatMap((group) => group.items)
    .filter((item) => item.bottomNav && visible(item))
    .map(toItem);

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
            ...(workerSession
              ? [
                  {
                    id: 'switch-worker',
                    label: t('terminal.switchWorker'),
                    icon: <UserRoundCog />,
                    onSelect: () => void endWorkerSession(),
                  },
                ]
              : []),
            {
              id: 'share-catalog',
              label: t('storefront.shareMenu'),
              icon: <QrCode />,
              onSelect: () => {
                setSharing(true);
              },
            },
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
              // En un terminal, salir también cierra la sesión de trabajo y vuelve a la selección.
              onSelect: () => {
                if (workerSession) {
                  void endWorkerSession();
                  return;
                }
                signOut.mutate(undefined, {
                  onSuccess: () => void navigate('/login', { replace: true }),
                });
              },
            },
          ]}
        />
      }
      bottomNav={<BottomNav items={bottomItems} />}
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
      <CatalogShareLauncher open={sharing} onOpenChange={setSharing} />
    </AppShell>
  );
}
