---
title: Feature: restaurant
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/data-model.md]
---

# restaurant — módulo vertical (activable)

**Estado:** marcador.

| Pantalla | Ruta                 | Acceso                                                  |
| -------- | -------------------- | ------------------------------------------------------- |
| Mesas    | `/restaurant/tables` | miembro, con el módulo `restaurant` activo (si no, 404) |

- Dominio listo: `tableStatusMachine`, `orderStatusMachine`, esquemas de zona y mesa; reglas para
  `restaurantZones` y `restaurantTables` (con módulo activo).

**Pendiente:** mapa de mesas, comandas (`restaurantOrders` + reglas), envío a cocina.
