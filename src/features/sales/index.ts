/** API pública de la feature sales (POS, carrito, historial). */
export {
  loadRestaurantOrderIntoCart,
  onRestaurantSalePaid,
  type RestaurantCartLine,
  type RestaurantSalePaid,
} from './application/saleEvents';
export { useSalesSince } from './application/useSales';
export { calculateTotals, type Totals, type TotalsLine } from './domain/totals';
export type { Sale } from './domain/sale';
export type { SaleRecord } from './domain/ports';

export const salesPages = {
  pos: () => import('./pages/PosPage'),
  history: () => import('./pages/SalesHistoryPage'),
};
