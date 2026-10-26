---
title: ADR 0006 — Numeración de ventas sin conexión
status: proposed
owner: equipo frontend
updated: 2026-10-25
related: [0003-firestore-offline-y-limites-de-transacciones.md, ../features/sales.md]
---

# ADR 0006 — Numeración de ventas sin conexión

## Contexto

Un consecutivo global requiere coordinación (transacción o servidor), imposible sin red (ADR 0003).
La facturación electrónica colombiana (DIAN) exige numeración autorizada y consecutiva.

## Decisión propuesta

1. **Número operativo local**: `<deviceCode>-<secuencia de 6 dígitos>` (`formatSaleNumber`). El
   `deviceCode` lo da `PlatformAdapter.deviceCode()`; la secuencia vive en IndexedDB por dispositivo.
2. **Número fiscal** (si aplica): lo asigna después una Cloud Function al sincronizar, en un campo
   aparte gestionado solo por el servidor. La venta original no se edita.

## Alternativas consideradas

- **Rangos pre-asignados por dispositivo** — consecutivo fiscal offline, pero exige gestión de
  rangos y sigue requiriendo servidor para asignarlos.
- **Timestamp como número** — no es legible ni consecutivo.

## Consecuencias

- Los tickets impresos offline muestran el número operativo.
- Hay que decidir si el número fiscal se guarda en la venta (actualización solo-servidor) o en una
  colección `fiscalNumbers`. Pendiente con el diseño de Cloud Functions.

## Estado

Propuesto. Debe aprobarse antes de implementar el registro de ventas (Prompt 2).
