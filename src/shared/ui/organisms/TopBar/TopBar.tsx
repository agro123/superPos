import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SyncState } from '@/shared/domain/sync';
import { t } from '@/shared/lib/i18n';
import { Avatar } from '../../atoms/Avatar';
import { IconButton } from '../../atoms/IconButton';
import { DropdownMenu, type DropdownMenuItem } from '../../molecules/DropdownMenu';
import { SyncStatusBadge } from '../../molecules/SyncStatusBadge';

export interface TopBarProps {
  businessName: string;
  user: { name: string; email: string };
  sync: { state: SyncState; pendingCount: number | null };
  userMenuItems: readonly DropdownMenuItem[];
  /** Si se define, muestra el botón de menú (pantallas pequeñas). */
  onMenuClick?: () => void;
  /** Acciones adicionales a la derecha (tema, bloqueo…). */
  actions?: ReactNode;
}

/** Barra superior: negocio, estado de sincronización y menú de usuario. */
export function TopBar({
  businessName,
  user,
  sync,
  userMenuItems,
  onMenuClick,
  actions,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-(--sp-z-sticky) flex min-h-16 items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur md:px-6">
      {onMenuClick ? (
        <IconButton
          label={t('ui.openMenu')}
          icon={<Menu />}
          onClick={onMenuClick}
          className="lg:hidden"
        />
      ) : null}
      <p className="min-w-0 flex-1 truncate text-base font-semibold text-text">{businessName}</p>
      <SyncStatusBadge state={sync.state} pendingCount={sync.pendingCount} />
      {actions}
      <DropdownMenu
        heading={user.email}
        items={userMenuItems}
        trigger={
          <button
            type="button"
            aria-label={`${t('ui.userMenu')}: ${user.name}`}
            data-tour="user-menu"
            className="inline-flex size-touch items-center justify-center rounded-full"
          >
            <Avatar name={user.name} size="sm" />
          </button>
        }
      />
    </header>
  );
}
