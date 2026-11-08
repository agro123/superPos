/** API pública de la feature settings (pantallas de configuración y sus formularios). */
export { BusinessPanel } from './ui/BusinessPanel';
export { ModulesPanel } from './ui/ModulesPanel';
export { PaymentsPanel } from './ui/PaymentsPanel';
export { TaxesPanel } from './ui/TaxesPanel';
export const settingsPages = {
  layout: () => import('./pages/SettingsLayoutPage'),
  business: () => import('./pages/BusinessSettingsPage'),
  modules: () => import('./pages/ModulesSettingsPage'),
  taxes: () => import('./pages/TaxesSettingsPage'),
  payments: () => import('./pages/PaymentsSettingsPage'),
  employees: () => import('./pages/EmployeesSettingsPage'),
  terminals: () => import('./pages/TerminalsSettingsPage'),
  storefront: () => import('./pages/StorefrontSettingsPage'),
  import: () => import('./pages/ImportSettingsPage'),
  plan: () => import('./pages/PlanSettingsPage'),
};
