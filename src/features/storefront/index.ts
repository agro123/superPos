/** API pública de la feature storefront (catálogo público, compartir y pedidos por WhatsApp). */
export { useEmailPreference, useStorefrontSync } from './application/useStorefront';
export { CatalogShareLauncher } from './ui/CatalogShareLauncher';
export { StorefrontPanel } from './ui/StorefrontPanel';

export const storefrontPages = {
  publicCatalog: () => import('./pages/PublicCatalogPage'),
};
