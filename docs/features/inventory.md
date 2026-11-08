---
title: Feature: inventory
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [catalog.md, ../adr/0003-firestore-offline-y-limites-de-transacciones.md]
---

# inventory — stock, movimientos y proveedores

**Estado:** existencias, entradas y ajustes, reabastecimiento, bitácora y proveedores.

| Pantalla                             | Ruta         | Permiso          |
| ------------------------------------ | ------------ | ---------------- |
| Inventario con alertas de stock bajo | `/inventory` | `inventory.view` |

- **Existencias:** niveles con `stockLevelOf` (`ok`, `low`, `out`, `untracked`), filtro "solo
  alertas". Con `inventory.adjust`: **Entrada** (unidades recibidas, proveedor opcional) y
  **Ajuste** por conteo físico (unidades contadas; motivo obligatorio). `stockDelta` calcula la
  diferencia y `recordStockChange` escribe `increment(delta)` + movimiento en un `writeBatch`.
- **Alerta activa:** contador de productos bajo umbral o agotados en "Inventario" (barra lateral y
  barra inferior), visible para todos los miembros.
- **Reabastecer:** `reorderSuggestions` (puro) usa el ritmo de venta de los últimos 14 días:
  agotados, bajo umbral o que se agotan antes de 3 días; sugiere unidades para cubrir 7/14/30 días
  más el umbral. "Enviar pedido" arma el texto (`purchaseOrderText`) por WhatsApp al teléfono del
  proveedor o por correo con el proveedor de correo configurado.
- **Movimientos:** bitácora inmutable (ventas, anulaciones, entradas, ajustes) con quién y proveedor.
  Las reglas solo permiten `supplierId` en movimientos `purchase`.
- **Proveedores:** nombre, teléfono, correo.

**Pendiente:** costo de compra por entrada (costo promedio), importación masiva, variantes.
