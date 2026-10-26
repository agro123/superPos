---
title: Feature: cash
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [../adr/0009-turnos-de-caja.md]
---

# cash — turnos de caja

**Estado:** UI de estado y modales de apertura/cierre (validan, no escriben).

| Pantalla | Ruta    | Permiso                            |
| -------- | ------- | ---------------------------------- |
| Caja     | `/cash` | `cash.open` (cerrar: `cash.close`) |

- Muestra el código del dispositivo, el turno abierto y el historial (datos del seed).
- Dominio listo: `cashShiftMachine` (`open → closing → closed`), `expectedCash`, `cashDifference`;
  reglas con transiciones validadas y gastos solo en turno abierto.

**Pendiente (Prompt 2):** abrir/cerrar turno, gastos y arqueo reales (ADR 0009).
