/** API pública de la feature settings (pantallas de configuración). */
export const settingsPages = {
  layout: () => import('./pages/SettingsLayoutPage'),
  business: () => import('./pages/BusinessSettingsPage'),
  modules: () => import('./pages/ModulesSettingsPage'),
  taxes: () => import('./pages/TaxesSettingsPage'),
  payments: () => import('./pages/PaymentsSettingsPage'),
  employees: () => import('./pages/EmployeesSettingsPage'),
  terminals: () => import('./pages/TerminalsSettingsPage'),
};
