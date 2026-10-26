---
title: Feature: customers
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [catalog.md]
---

# customers — clientes (módulo activable)

**Estado:** lista y formulario con escritura real.

| Pantalla | Ruta         | Permiso                                                            |
| -------- | ------------ | ------------------------------------------------------------------ |
| Clientes | `/customers` | `customers.view` (editar: `customers.manage`) + módulo `customers` |

- Nombre, cédula/NIT, teléfono, email, notas. Escrituras offline con "pendiente de sincronizar".

**Pendiente:** asociar cliente a la venta, historial por cliente, fiado.
