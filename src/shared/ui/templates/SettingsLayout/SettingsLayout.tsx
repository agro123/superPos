import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';

export interface SettingsNavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export interface SettingsLayoutProps {
  /** Encabezado de la sección (normalmente `<PageHeader />`). */
  header: ReactNode;
  items: readonly SettingsNavItem[];
  children: ReactNode;
}

/** Configuración con subnavegación: pestañas horizontales en móvil, columna en escritorio. */
export function SettingsLayout({ header, items, children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {header}
      <div className="flex flex-col gap-6 md:flex-row">
        <nav aria-label={t('ui.settingsNav')} className="md:w-56 md:shrink-0">
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-touch items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap [&_svg]:size-4',
                      isActive
                        ? 'bg-primary-soft text-primary-soft-fg'
                        : 'text-text-muted hover:bg-surface-muted',
                    )
                  }
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
