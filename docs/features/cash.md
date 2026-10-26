---
title: Feature: cash
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [../adr/0009-turnos-de-caja.md]
---

# cash — turnos de caja

**Estado:** turnos reales por dispositivo (ADR 0009): apertura, gastos, arqueo y cierre.

| Pantalla | Ruta    | Permiso                            |
| -------- | ------- | ---------------------------------- |
| Caja     | `/cash` | `cash.open` (cerrar: `cash.close`) |

- **Abrir caja** exige una base de efectivo > 0. Sin turno `open` en el dispositivo, el POS no vende.
- Las ventas guardan `cashShiftId`; `summarizeShift` (puro) calcula por turno: efectivo recibido,
  vueltos, gastos, salidas de efectivo (vueltos + gastos), ingreso neto por método (tarjeta,
  transferencia…) y `expectedCash` = base + efectivo neto − gastos. Excluye ventas anuladas.
- **Cerrar caja**: pasa a `closing` (el POS se bloquea), muestra el resumen y pide el efectivo
  contado con faltante/sobrante en vivo; confirmar → `closed` con `expectedCashMinor` y
  `countedCashMinor`. Cerrar el modal cancela el arqueo (`closing → open`).
- La caja lee `sales` con una proyección propia (`shiftSaleSchema`): `sales` depende de `cash`
  y no puede haber ciclo.
- Gastos: `cashShifts/{id}/expenses`, solo en turno abierto.
