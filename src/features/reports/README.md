# reports

Dashboard (inicio) y reportes de ventas: resumen, ventas por día, productos más vendidos.

- **Entidades:** `ReportSale`, `SalesSummary`, `DailyTotal`
- **Permisos:** todo miembro (métricas con `reports.view`)
- **Estado:** Implementado (lectura).
- **API pública:** `index.ts` (incluye `reportsPages` con carga diferida). No importar archivos internos desde fuera.
- **Capas:** `domain/` (puro, con pruebas) → `application/` (hooks) → `infrastructure/` (Firestore) · `ui/`, `pages/`.

Detalle (pantallas, reglas y pendientes): [docs/features/reports.md](../../../docs/features/reports.md).
