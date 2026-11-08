---
title: Feature: users
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../product/roles-and-permissions.md, ../adr/0004-permisos-por-rules-vs-custom-claims.md]
---

# users — empleados, roles y permisos

**Estado:** implementado, con roles personalizados y límites por plan (ADR 0015).

- **Cupos de trabajador:** gratis 1, premium 3 (`seats/{id}`). Aceptar una invitación de empleado
  toma el primer cupo libre en el mismo batch; si el plan no lo admite, se informa "alcanzó el límite
  de trabajadores". Al editar un miembro, activarlo o volverlo empleado toma un cupo; desactivarlo o
  volverlo admin lo libera. La pantalla muestra "Cupos de trabajador: X de N".
- **Premium en las reglas:** crear o editar roles personalizados y tener más administradores.

- **Roles personalizados** (`roles/{id}`: nombre + permisos), en Configuración → Empleados. Se crean
  desde plantillas (Cajero, Inventario, Mesero, Supervisor) o desde cero. Un miembro o invitación
  con rol personalizado guarda `role: 'custom'`, `customRoleId` y en `extraPermissions` los permisos
  del rol: las reglas siguen sin lecturas extra (`custom` no trae permisos propios). Al editar un rol,
  un batch actualiza los permisos de sus miembros. Un rol en uso no se puede eliminar desde la UI.
  Las reglas exigen que `customRoleId` exista y solo con `role == 'custom'`.

- `permissions.ts`: `PERMISSIONS`, `ROLE_PERMISSIONS`, `hasPermission`, `grantablePermissions`.
- `CurrentMemberProvider` carga `members/{uid}` del negocio activo; `usePermission` y `<Can>` lo usan.
- `EmployeesPanel` (en `/settings/employees`, requiere `users.manage`): lista de miembros, editor de
  rol / permisos extra / estado, invitar por email y revocar invitaciones.
- Invitaciones: el invitado las ve (consulta _collection group_ por su email verificado) en
  `/onboarding` y `/select-business`, y las acepta en un batch.
