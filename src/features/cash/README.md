# cash

Turnos de caja: estado, apertura y cierre (solo UI), arqueo puro.

- **Entidades:** `CashShift`, `Expense`, `cashShiftMachine`
- **Permisos:** `cash.open`, `cash.close`
- **Estado:** UI + dominio. Lógica en el Prompt 2 (ADR 0009).
- **API pública:** `index.ts` (incluye `cashPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/cash.md](../../../docs/features/cash.md).
