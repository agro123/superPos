# restaurant

Módulo vertical activable: tablero de mesas, comandas por rondas, pantalla de cocina y cobro en el POS.

- **Entidades:** `Zone`, `Table`, `RestaurantOrder` (`restaurantOrders`), `tableStatusMachine`, `orderStatusMachine`
- **Permisos:** tomar pedidos `sales.create`; configurar mesas `settings.manage`.
- **API pública:** `index.ts` (`restaurantPages`, `registerRestaurantSaleHandler`).
- El cobro reutiliza el POS: `loadRestaurantOrderIntoCart` y el aviso `onRestaurantSalePaid` de `sales`.

Detalle: [docs/features/restaurant.md](../../../docs/features/restaurant.md).
