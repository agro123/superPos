---
title: Roles y permisos
status: accepted
owner: producto
updated: 2026-10-25
related: [../adr/0004-permisos-por-rules-vs-custom-claims.md, ../architecture/security.md]
---

# Roles y permisos

Fuente única: `src/features/users/domain/permissions.ts` (`ROLE_PERMISSIONS`). `firestore.rules`
replica la tabla y una prueba verifica que coincidan. Un admin puede conceder **permisos extra** a
un empleado (`members/{uid}.extraPermissions`).

| Permiso            | Qué permite                              | Admin | Empleado |
| ------------------ | ---------------------------------------- | :---: | :------: |
| `sales.create`     | Vender (POS); descontar stock al vender  |   ✔   |    ✔     |
| `sales.view`       | Ver historial de ventas                  |   ✔   |    ✔     |
| `sales.void`       | Anular ventas                            |   ✔   |  extra   |
| `cash.open`        | Abrir caja, registrar gastos, ver turnos |   ✔   |    ✔     |
| `cash.close`       | Arqueo y cierre de caja                  |   ✔   |  extra   |
| `catalog.manage`   | Crear y editar productos y categorías    |   ✔   |  extra   |
| `inventory.view`   | Ver inventario y proveedores             |   ✔   |    ✔     |
| `inventory.adjust` | Ajustar stock, gestionar proveedores     |   ✔   |  extra   |
| `customers.view`   | Ver clientes                             |   ✔   |    ✔     |
| `customers.manage` | Crear y editar clientes                  |   ✔   |    ✔     |
| `reports.view`     | Reportes y métricas del dashboard        |   ✔   |  extra   |
| `users.manage`     | Empleados, roles e invitaciones          |   ✔   |  extra   |
| `settings.manage`  | Configuración del negocio y módulos      |   ✔   |  extra   |

Reglas adicionales (servidor):

- Nadie cambia su propio rol o estado; el dueño (`ownerUid`) no puede perder su acceso.
- Un miembro `disabled` no tiene ningún permiso.
- Módulos apagados: sus colecciones quedan inaccesibles aunque se tenga el permiso.

En la UI: `usePermission('x')`, `<Can permission="x">`, guardas `RequirePermission` y la navegación
filtrada. **Son solo experiencia de usuario.**
