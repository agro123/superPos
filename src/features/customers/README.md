# customers

Clientes del negocio (módulo activable `customers`).

- **Entidades:** `Customer`
- **Permisos:** `customers.view`, `customers.manage`
- **Estado:** CRUD implementado.
- **API pública:** `index.ts` (incluye `customersPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/customers.md](../../../docs/features/customers.md).
