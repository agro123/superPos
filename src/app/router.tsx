import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { authPages } from '@/features/auth';
import { businessPages } from '@/features/business';
import { cashPages } from '@/features/cash';
import { catalogPages } from '@/features/catalog';
import { customersPages } from '@/features/customers';
import { inventoryPages } from '@/features/inventory';
import { platformPages } from '@/features/platform';
import { reportsPages } from '@/features/reports';
import { restaurantPages } from '@/features/restaurant';
import { salesPages } from '@/features/sales';
import { settingsPages } from '@/features/settings';
import { storefrontPages } from '@/features/storefront';
import { terminalsPages } from '@/features/terminals';
import type { Permission } from '@/features/users';
import { RequireAuth } from './guards/RequireAuth';
import { RequireBusiness } from './guards/RequireBusiness';
import { RequireModule, RequirePermission } from './guards/RequirePermission';
import { RequirePlatformAdmin } from './guards/RequirePlatformAdmin';
import { RequireUnlocked } from './guards/RequireUnlocked';
import { PlatformLayout } from './layout/PlatformLayout';
import { RootLayout } from './layout/RootLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { RouteErrorPage } from './pages/RouteErrorPage';

type PageModule = () => Promise<{ default: ComponentType }>;

/** Ruta con carga diferida del módulo de la página. */
const page = (load: PageModule) => async () => ({ Component: (await load()).default });

/** Ruta protegida por permiso, con su página cargada bajo demanda. */
const guarded = (path: string, permission: Permission, load: PageModule): RouteObject => ({
  path,
  element: <RequirePermission permission={permission} />,
  children: [{ index: true, lazy: page(load) }],
});

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: '/dev/ui', lazy: page(() => import('./dev/UiCatalogPage')) }]
  : [];

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', lazy: page(authPages.login) },
      // Terminal POS: identidad propia (anónima) de la instalación, fuera de RequireAuth.
      { path: '/terminal', lazy: page(terminalsPages.terminal) },
      // Catálogo público: sin sesión (ADR 0012).
      { path: '/c/:slug', lazy: page(storefrontPages.publicCatalog) },
      {
        element: <RequireAuth />,
        children: [
          { path: '/onboarding', lazy: page(businessPages.onboarding) },
          { path: '/select-business', lazy: page(businessPages.selectBusiness) },
          {
            // Super administrador: fuera de RequireBusiness (no necesita negocio propio).
            path: '/platform',
            element: <RequirePlatformAdmin />,
            children: [
              {
                element: <PlatformLayout />,
                children: [
                  { index: true, lazy: page(platformPages.businesses) },
                  { path: 'businesses/:businessId', lazy: page(platformPages.businessDetail) },
                  { path: '*', element: <NotFoundPage /> },
                ],
              },
            ],
          },
          {
            element: <RequireBusiness />,
            children: [
              { path: '/lock', lazy: page(authPages.lock) },
              {
                element: <RequireUnlocked />,
                children: [
                  {
                    element: <RootLayout />,
                    children: [
                      { index: true, lazy: page(reportsPages.dashboard) },
                      guarded('pos', 'sales.create', salesPages.pos),
                      guarded('sales', 'sales.view', salesPages.history),
                      guarded('catalog', 'catalog.manage', catalogPages.catalog),
                      guarded('inventory', 'inventory.view', inventoryPages.inventory),
                      guarded('cash', 'cash.open', cashPages.cash),
                      {
                        element: <RequireModule module="customers" />,
                        children: [
                          guarded('customers', 'customers.view', customersPages.customers),
                        ],
                      },
                      guarded('reports', 'reports.view', reportsPages.reports),
                      {
                        path: 'settings',
                        element: <RequirePermission permission="settings.manage" />,
                        children: [
                          {
                            lazy: page(settingsPages.layout),
                            children: [
                              { index: true, element: <Navigate to="business" replace /> },
                              { path: 'business', lazy: page(settingsPages.business) },
                              { path: 'modules', lazy: page(settingsPages.modules) },
                              { path: 'taxes', lazy: page(settingsPages.taxes) },
                              { path: 'payments', lazy: page(settingsPages.payments) },
                              { path: 'storefront', lazy: page(settingsPages.storefront) },
                              guarded('import', 'catalog.manage', settingsPages.import),
                              guarded('employees', 'users.manage', settingsPages.employees),
                              guarded('terminals', 'users.manage', settingsPages.terminals),
                            ],
                          },
                        ],
                      },
                      {
                        path: 'restaurant',
                        element: <RequireModule module="restaurant" />,
                        children: [{ path: 'tables', lazy: page(restaurantPages.tables) }],
                      },
                      { path: '*', element: <NotFoundPage /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      ...devRoutes,
      {
        path: '*',
        element: (
          <main id="main-content">
            <NotFoundPage />
          </main>
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
