# sales

Punto de venta (carrito persistido, cobro solo UI), totales puros, ventas inmutables e historial.

- **Entidades:** `CartLine`, `Totals`, `Sale`, `SaleLine`, `StockDecrement`; puertos `SaleReader`/`SaleWriter`
- **Permisos:** `sales.create`, `sales.view`, `sales.void`
- **Estado:** registra ventas (`saleWriter`: venta + stock + movimientos en un `writeBatch`, L1) con turno de caja abierto; órdenes simultáneas.
- **API pública:** `index.ts` (incluye `salesPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/sales.md](../../../docs/features/sales.md).
