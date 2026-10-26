# catalog

Productos y categorías: CRUD con Zod, imagen vía outbox, búsqueda por código de barras, nivel de stock.

- **Entidades:** `Product`, `Category`, `StockLevel`
- **Permisos:** `catalog.manage`
- **Estado:** CRUD implementado. Pendiente: variantes.
- **API pública:** `index.ts` (incluye `catalogPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/catalog.md](../../../docs/features/catalog.md).
