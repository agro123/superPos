/** API pública de la feature reports (dashboard y reportes). */
export const reportsPages = {
  dashboard: () => import('./pages/DashboardPage'),
  reports: () => import('./pages/ReportsPage'),
};
