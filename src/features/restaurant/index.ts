/** API pública del módulo vertical restaurant (activable por negocio). */
export { registerRestaurantSaleHandler } from './application/registerRestaurantSaleHandler';

export const restaurantPages = {
  tables: () => import('./pages/TablesPage'),
  table: () => import('./pages/TableOrderPage'),
  kitchen: () => import('./pages/KitchenPage'),
};
