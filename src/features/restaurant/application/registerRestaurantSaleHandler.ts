import { onRestaurantSalePaid } from '@/features/sales';
import { closeOrder } from '../infrastructure/restaurantRepository';

/**
 * Cuando el POS registra la venta de una comanda, la marca cobrada y libera la mesa. Lo llama `app/`
 * al arrancar (sales no depende de restaurant).
 */
export function registerRestaurantSaleHandler(): () => void {
  return onRestaurantSalePaid(({ businessId, saleId, restaurant }) => {
    closeOrder(
      businessId,
      { id: restaurant.orderId, tableId: restaurant.tableId },
      { status: 'paid', saleId },
    );
  });
}
