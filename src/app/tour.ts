import type { ModuleId } from '@/features/business';
import type { Permission } from '@/features/users';
import type { MessageKey } from '@/shared/lib/i18n';

/** Paso del tour: ancla `data-tour` (las de navegación son `nav-<ruta>`) y su explicación. */
export interface AppTourStep {
  target?: string;
  title: MessageKey;
  body: MessageKey;
  /** Sin permiso, el paso se omite (un mesero no ve Reportes). */
  permission?: Permission;
  module?: ModuleId;
}

/** Recorrido de la app. Se filtra por permisos y módulos del usuario antes de mostrarse. */
export const APP_TOUR: readonly AppTourStep[] = [
  { title: 'tour.welcome.title', body: 'tour.welcome.body' },
  { target: 'nav-/', title: 'tour.home.title', body: 'tour.home.body' },
  {
    target: 'nav-/pos',
    title: 'tour.pos.title',
    body: 'tour.pos.body',
    permission: 'sales.create',
  },
  {
    target: 'nav-/cash',
    title: 'tour.cash.title',
    body: 'tour.cash.body',
    permission: 'cash.open',
  },
  {
    target: 'nav-/sales',
    title: 'tour.sales.title',
    body: 'tour.sales.body',
    permission: 'sales.view',
  },
  {
    target: 'nav-/inventory',
    title: 'tour.inventory.title',
    body: 'tour.inventory.body',
    permission: 'inventory.view',
  },
  {
    target: 'nav-/catalog',
    title: 'tour.catalog.title',
    body: 'tour.catalog.body',
    permission: 'catalog.manage',
  },
  {
    target: 'nav-/customers',
    title: 'tour.customers.title',
    body: 'tour.customers.body',
    permission: 'customers.view',
    module: 'customers',
  },
  {
    target: 'nav-/reports',
    title: 'tour.reports.title',
    body: 'tour.reports.body',
    permission: 'reports.view',
  },
  {
    target: 'nav-/settings',
    title: 'tour.settings.title',
    body: 'tour.settings.body',
    permission: 'settings.manage',
  },
  { target: 'user-menu', title: 'tour.userMenu.title', body: 'tour.userMenu.body' },
];

export function tourFor(
  can: (permission: Permission) => boolean,
  modules: Readonly<Record<ModuleId, boolean>>,
) {
  return APP_TOUR.filter(
    (step) => (!step.permission || can(step.permission)) && (!step.module || modules[step.module]),
  );
}
