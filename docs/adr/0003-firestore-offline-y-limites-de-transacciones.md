---
title: ADR 0003 — Firestore offline y límites de las transacciones
status: accepted
owner: equipo frontend
updated: 2026-10-25
related:
  [../architecture/offline-sync.md, ../features/sales.md, 0006-numeracion-de-ventas-offline.md]
---

# ADR 0003 — Firestore offline y límites de las transacciones

## Contexto

La app debe vender sin conexión. Firestore con `persistentLocalCache` lee de IndexedDB y encola
escrituras, pero **las transacciones (`runTransaction`) fallan sin conexión**. En SmartTable el
inventario nunca se descontaba (L1).

## Decisión

1. Caché persistente con `persistentMultipleTabManager` (`shared/infrastructure/firebase/app.ts`).
2. **Ningún flujo que deba funcionar offline usa transacciones.** Una venta se registra con un
   único `writeBatch`: documento de venta + `increment(-cantidad)` por producto + movimientos de
   inventario. `increment` es conmutativo y se fusiona en el servidor (puerto `SaleWriter`).
3. IDs generados en cliente (`doc(collection(...)).id`).
4. **Se permite stock negativo** tras ventas offline concurrentes; la UI lo muestra como "Agotado"
   y el inventario lo alerta. Las reglas solo exigen que una venta _descuente_ stock.
5. Las escrituras no se esperan en la UI (`trackWrite`): sin conexión la promesa no se resuelve
   hasta sincronizar.

## Alternativas consideradas

- **Transacciones con reintento al volver la red** — la venta no existiría localmente; inaceptable.
- **Bloquear la venta si el stock local es 0** — con varios dispositivos offline no garantiza nada
  y frena la caja. Se prefiere vender y alertar.
- **Reservas de stock vía Cloud Functions** — requiere red.

## Consecuencias

- La consistencia fuerte (stock nunca negativo, numeración consecutiva) no es posible offline;
  ver ADR 0006 para la numeración.
- Las reglas validan forma, autoría e invariantes (total = base + impuestos), no el inventario global.

## Estado

Aceptado. El registro real de ventas se implementa en el Prompt 2 siguiendo este ADR.
