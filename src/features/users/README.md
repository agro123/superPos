# users

Miembros, roles, permisos (`ROLE_PERMISSIONS`), `usePermission`, `<Can>`, invitaciones y panel de empleados.

- **Entidades:** `Member`, `Invitation`, `Permission`, `Role`
- **Permisos:** `users.manage` para administrar
- **Estado:** Implementado.
- **API pública:** `index.ts` (incluye `usersPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/users.md](../../../docs/features/users.md).
