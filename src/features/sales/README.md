# sales

Punto de venta (carrito persistido, cobro solo UI), totales puros, ventas inmutables e historial.

- **Entidades:** `CartLine`, `Totals`, `Sale`, `SaleLine`, `StockDecrement`; puertos `SaleReader`/`SaleWriter`
- **Permisos:** `sales.create`, `sales.view`, `sales.void`
- **Estado:** UI + dominio. **No registra ventas**: `SaleWriter` se implementa en el Prompt 2 (ADR 0003, 0006).
- **API pública:** `index.ts` (incluye `salesPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/sales.md](../../../docs/features/sales.md).
