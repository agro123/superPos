import {
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  Package,
  Settings,
  ShoppingCart,
  UsersRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ModuleId } from '@/features/business';
import type { Permission } from '@/features/users';
import type { MessageKey } from '@/shared/lib/i18n';

export interface NavEntry {
  to: string;
  label: MessageKey;
  icon: ReactNode;
  end?: boolean;
  /** Sin permiso, el ítem no se muestra. */
  permission?: Permission;
  /** Solo si el módulo está activo. */
  module?: ModuleId;
}

export interface NavGroup {
  id: string;
  label?: MessageKey;
  items: readonly NavEntry[];
}

/** Navegación principal (2 niveles como máximo). */
export const NAVIGATION: readonly NavGroup[] = [
  {
    id: 'sell',
    items: [
      { to: '/', label: 'nav.home', icon: <Home />, end: true },
      { to: '/pos', label: 'nav.pos', icon: <ShoppingCart />, permission: 'sales.create' },
      { to: '/sales', label: 'nav.sales', icon: <ClipboardList />, permission: 'sales.view' },
      { to: '/cash', label: 'nav.cash', icon: <Wallet />, permission: 'cash.open' },
    ],
  },
  {
    id: 'manage',
    label: 'nav.sectionManage',
    items: [
      { to: '/catalog', label: 'nav.catalog', icon: <Package />, permission: 'catalog.manage' },
      { to: '/inventory', label: 'nav.inventory', icon: <Boxes />, permission: 'inventory.view' },
      {
        to: '/customers',
        label: 'nav.customers',
        icon: <UsersRound />,
        permission: 'customers.view',
        module: 'customers',
      },
      { to: '/reports', label: 'nav.reports', icon: <BarChart3 />, permission: 'reports.view' },
      { to: '/settings', label: 'nav.settings', icon: <Settings />, permission: 'settings.manage' },
    ],
  },
  {
    id: 'modules',
    label: 'nav.sectionModules',
    items: [
      {
        to: '/restaurant/tables',
        label: 'nav.tables',
        icon: <UtensilsCrossed />,
        module: 'restaurant',
      },
    ],
  },
];
