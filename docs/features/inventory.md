---
title: Feature: inventory
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [catalog.md, ../adr/0003-firestore-offline-y-limites-de-transacciones.md]
---

# inventory — stock, movimientos y proveedores

**Estado:** solo lectura.

| Pantalla                             | Ruta         | Permiso          |
| ------------------------------------ | ------------ | ---------------- |
| Inventario con alertas de stock bajo | `/inventory` | `inventory.view` |

- Niveles con `stockLevelOf` (catálogo): `ok`, `low`, `out`, `untracked`. Filtro "solo alertas".
- Modelo listo: `inventoryMovements` (inmutables) y `suppliers`, con reglas y pruebas.

**Pendiente (Prompt 2):** ajustes y compras (movimiento + `increment` en un batch), proveedores.
