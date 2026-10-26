# cash

Turnos de caja: estado, apertura y cierre (solo UI), arqueo puro.

- **Entidades:** `CashShift`, `Expense`, `cashShiftMachine`
- **Permisos:** `cash.open`, `cash.close`
- **Estado:** apertura, gastos, resumen y cierre con arqueo (ADR 0009). API: `useCurrentShift`.
- **API pública:** `index.ts` (incluye `cashPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/cash.md](../../../docs/features/cash.md).
