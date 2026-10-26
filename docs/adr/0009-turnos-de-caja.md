---
title: ADR 0009 — Un turno de caja abierto por dispositivo
status: proposed
owner: equipo frontend
updated: 2026-10-25
related: [../features/cash.md, 0003-firestore-offline-y-limites-de-transacciones.md]
---

# ADR 0009 — Un turno de caja abierto por dispositivo

## Contexto

El arqueo compara el efectivo esperado con el contado. Con varios dispositivos y sin conexión no se
puede garantizar "un turno abierto por negocio" (no hay transacciones offline, ADR 0003).

## Decisión propuesta

- Cada dispositivo (`deviceCode`) tiene a lo sumo un turno abierto; las ventas en efectivo de ese
  dispositivo se asocian a él (`cashShiftId`).
- Transiciones `open → closing → closed` (y `closing → open` para cancelar el arqueo), validadas en
  `cashShiftMachine` y en las reglas (`validShiftTransition`).
- El efectivo esperado se calcula con `expectedCash` (base + ventas en efectivo − gastos).

## Alternativas consideradas

- **Un turno por negocio** — natural en tiendas de una sola caja, pero imposible de garantizar offline.
- **Turno por empleado** — complica el arqueo físico de un cajón compartido.

## Consecuencias

- Los reportes por turno agrupan por dispositivo.
- Si dos dispositivos abren turno a la vez sin red, ambos son válidos.

## Estado

Propuesto. Implementado: el POS exige turno `open` y el cierre usa `summarizeShift`.
