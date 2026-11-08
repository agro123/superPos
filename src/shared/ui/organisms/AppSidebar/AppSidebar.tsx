import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { PremiumBadge } from '../../molecules/PremiumBadge';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Coincidencia exacta de ruta (para "/"). */
  end?: boolean;
  /** Contador de alertas (p. ej. productos con stock bajo); se anuncia junto al nombre. */
  badge?: { count: number; label: string };
  /** Ancla del tour guiado (`data-tour`). */
  tourId?: string;
  /** Marca de función premium no incluida en el plan (texto visible). */
  premiumLabel?: string;
}

export interface NavSection {
  id: string;
  label?: string;
  items: readonly NavItem[];
}

export interface AppSidebarProps {
  sections: readonly NavSection[];
  /** Marca o nombre del negocio en la cabecera. */
  brand: ReactNode;
  footer?: ReactNode;
  /** Se llama al navegar (p. ej. para cerrar el cajón en móvil). */
  onNavigate?: () => void;
  className?: string;
}

/** Navegación principal: máximo 2 niveles (sección → ítem). Recibe los ítems ya filtrados por permiso. */
export function AppSidebar({ sections, brand, footer, onNavigate, className }: AppSidebarProps) {
  return (
    <div className={cn('flex h-full flex-col gap-4 bg-surface p-3', className)}>
      <div className="flex min-h-touch items-center px-2">{brand}</div>
      <nav aria-label={t('ui.mainNav')} className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-1">
            {section.label ? (
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-text-subtle uppercase">
                {section.label}
              </p>
            ) : null}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    data-tour={item.tourId}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-touch items-center gap-3 rounded-md px-3 text-base font-medium transition-colors [&_svg]:size-5',
                        isActive
                          ? 'bg-primary-soft text-primary-soft-fg'
                          : 'text-text-muted hover:bg-surface-muted hover:text-text',
                      )
                    }
                  >
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                    {item.premiumLabel ? (
                      <PremiumBadge label={item.premiumLabel} className="ml-auto" />
                    ) : null}
                    {item.badge && item.badge.count > 0 ? (
                      <span className="ml-auto rounded-full bg-danger px-2 text-xs font-semibold text-danger-fg">
                        {item.badge.count}
                        <span className="sr-only"> {item.badge.label}</span>
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {footer ? <div className="border-t border-border pt-3">{footer}</div> : null}
    </div>
  );
}
