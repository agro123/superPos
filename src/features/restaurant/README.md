# restaurant

Módulo vertical activable: mesas, zonas y comandas.

- **Entidades:** `Zone`, `Table`, `tableStatusMachine`, `orderStatusMachine`
- **Permisos:** miembro + módulo `restaurant` activo
- **Estado:** Marcador; dominio y reglas listos.
- **API pública:** `index.ts` (incluye `restaurantPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/restaurant.md](../../../docs/features/restaurant.md).
