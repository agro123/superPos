/** API pública de la feature inventory (stock, movimientos, proveedores). */
export { useAdjustmentsSince } from './application/useInventory';
export const inventoryPages = {
  inventory: () => import('./pages/InventoryPage'),
};
