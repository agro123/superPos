# inventory

Stock por producto con alertas; modelo de movimientos y proveedores.

- **Entidades:** `InventoryMovement`, `Supplier`
- **Permisos:** `inventory.view` (ajustar: `inventory.adjust`)
- **Estado:** Solo lectura. Ajustes en el Prompt 2.
- **API pública:** `index.ts` (incluye `inventoryPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/inventory.md](../../../docs/features/inventory.md).
