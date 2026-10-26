# settings

Pantallas de configuración: negocio, módulos, impuestos, medios de pago, empleados.

- **Entidades:** usa las de `business` y `users`
- **Permisos:** `settings.manage`, `users.manage`
- **Estado:** Implementado.
- **API pública:** `index.ts` (incluye `settingsPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/settings.md](../../../docs/features/settings.md).
