import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { Drawer } from '../../organisms/Drawer';

export interface AppShellProps {
  /** Navegación lateral (normalmente `<AppSidebar />`). */
  sidebar: ReactNode;
  /** Barra superior (normalmente `<TopBar />`). */
  topBar: ReactNode;
  /** Estado del cajón de navegación en pantallas pequeñas. */
  mobileNavOpen: boolean;
  onMobileNavOpenChange: (open: boolean) => void;
  /** Avisos globales sobre el contenido (nueva versión, sin conexión…). */
  banner?: ReactNode;
  /** Barra de pestañas inferior, visible solo sin barra lateral (< lg). */
  bottomNav?: ReactNode;
  children: ReactNode;
}

/** Esqueleto principal: barra lateral fija en escritorio, cajón en móvil, barra superior y contenido. */
export function AppShell({
  sidebar,
  topBar,
  mobileNavOpen,
  onMobileNavOpenChange,
  banner,
  bottomNav,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--sp-z-toast) focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-md"
      >
        {t('ui.skipToContent')}
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border lg:block">
        {sidebar}
      </aside>
      <Drawer
        open={mobileNavOpen}
        onOpenChange={onMobileNavOpenChange}
        title={t('ui.menu')}
        side="left"
        hideHeader
      >
        {sidebar}
      </Drawer>
      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}
        {banner}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn('flex-1 outline-none', bottomNav ? 'pb-16 lg:pb-0' : undefined)}
        >
          {children}
        </main>
        {bottomNav ? <div className="lg:hidden">{bottomNav}</div> : null}
      </div>
    </div>
  );
}
