/** API pública de la feature platform (super administrador de la plataforma). */
export const platformPages = {
  businesses: () => import('./pages/PlatformBusinessesPage'),
  businessDetail: () => import('./pages/PlatformBusinessDetailPage'),
};
