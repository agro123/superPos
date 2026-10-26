---
title: Feature: users
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../product/roles-and-permissions.md, ../adr/0004-permisos-por-rules-vs-custom-claims.md]
---

# users — empleados, roles y permisos

**Estado:** implementado.

- `permissions.ts`: `PERMISSIONS`, `ROLE_PERMISSIONS`, `hasPermission`, `grantablePermissions`.
- `CurrentMemberProvider` carga `members/{uid}` del negocio activo; `usePermission` y `<Can>` lo usan.
- `EmployeesPanel` (en `/settings/employees`, requiere `users.manage`): lista de miembros, editor de
  rol / permisos extra / estado, invitar por email y revocar invitaciones.
- Invitaciones: el invitado las ve (consulta _collection group_ por su email verificado) en
  `/onboarding` y `/select-business`, y las acepta en un batch.
