---
title: Feature: settings
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [business.md, users.md]
---

# settings — configuración del negocio

**Estado:** implementado.

| Sección                        | Ruta                  | Permiso           |
| ------------------------------ | --------------------- | ----------------- |
| Negocio (nombre, zona horaria) | `/settings/business`  | `settings.manage` |
| Módulos                        | `/settings/modules`   | `settings.manage` |
| Impuestos                      | `/settings/taxes`     | `settings.manage` |
| Medios de pago                 | `/settings/payments`  | `settings.manage` |
| Empleados                      | `/settings/employees` | `users.manage`    |

Escrituras optimistas (`businessWrites`). La moneda y el tipo se muestran solo lectura.

**Pendiente:** editar la lista de tasas de impuesto.
