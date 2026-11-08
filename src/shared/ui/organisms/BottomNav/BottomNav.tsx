import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';

export interface BottomNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Coincidencia exacta de ruta (para "/"). */
  end?: boolean;
  /** Contador de alertas, anunciado junto al nombre. */
  badge?: { count: number; label: string };
}

export interface BottomNavProps {
  /** Accesos principales (máx. 5), ya filtrados por permiso. */
  items: readonly BottomNavItem[];
  className?: string;
}

/** Barra de pestañas inferior para móvil: accesos rápidos a las pantallas de operación. */
export function BottomNav({ items, className }: BottomNavProps) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label={t('ui.quickNav')}
      className={cn(
        'fixed inset-x-0 bottom-0 z-(--sp-z-sticky) border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="flex">
        {items.map((item) => (
          <li key={item.to} className="min-w-0 flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors [&_svg]:size-5',
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text',
                )
              }
            >
              <span aria-hidden className="relative">
                {item.icon}
                {item.badge && item.badge.count > 0 ? (
                  <span className="absolute -top-1 -right-2 rounded-full bg-danger px-1 text-[10px] leading-4 font-semibold text-danger-fg">
                    {item.badge.count}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate px-1">
                {item.label}
                {item.badge && item.badge.count > 0 ? (
                  <span className="sr-only"> {item.badge.label}</span>
                ) : null}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
