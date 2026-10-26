# auth

Sesión con Firebase Auth (login, registro, recuperación), perfil `users/{uid}` y bloqueo de pantalla con PIN local.

- **Entidades:** `SessionUser`, `UserProfile`, `PinCredential`, `LockoutState`
- **Permisos:** público (`/login`), miembro (`/lock`)
- **Estado:** Implementado. Pendiente: cambio rápido de empleado con custom tokens.
- **API pública:** `index.ts` (incluye `authPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/auth.md](../../../docs/features/auth.md).
