---
title: Feature: auth
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../adr/0008-pin-de-desbloqueo-en-el-dispositivo.md, ../architecture/security.md]
---

# auth — sesión, login y bloqueo con PIN

**Estado:** implementado.

| Pantalla                                             | Ruta     | Acceso  |
| ---------------------------------------------------- | -------- | ------- |
| Iniciar sesión / crear cuenta / recuperar contraseña | `/login` | público |
| Bloqueo de pantalla y cambio de empleado             | `/lock`  | miembro |

- Firebase Auth con email y contraseña; `onIdTokenChanged` alimenta `useSessionStore`.
- Al registrarse se envía verificación de email (necesaria para aceptar invitaciones).
- Perfil `users/{uid}` creado al registrarse o en el primer login (`ensureUserProfile`).
- Sin conexión: login deshabilitado con aviso; la sesión previa sigue activa.
- PIN: `PinService` (`application/pinService.ts`) sobre los puertos `PinHasher` (PBKDF2 WebCrypto)
  y `PinStore` (IndexedDB). Bloqueo persistido (`useLockStore`); `RequireUnlocked` redirige a `/lock`.

**Pendiente:** cambio rápido de empleado con custom tokens (Cloud Functions).
