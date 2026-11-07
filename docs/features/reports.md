---
title: Feature: reports
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [sales.md]
---

# reports — dashboard y reportes

**Estado:** implementado sobre las ventas existentes (excluye anuladas).

| Pantalla           | Ruta       | Acceso                                         |
| ------------------ | ---------- | ---------------------------------------------- |
| Inicio (dashboard) | `/`        | todo miembro; métricas solo con `reports.view` |
| Reportes           | `/reports` | `reports.view`                                 |

- Dominio: `summarizeSales`, `salesByDay` (zona horaria del negocio), `topProducts`.
- Gráfico de barras de una serie (sin leyenda, tooltip por barra, tabla accesible "Ver como tabla").

- **Caja por trabajador:** tabla del periodo (componente de `cash`): turnos abiertos/cerrados,
  ventas, anulaciones, efectivo, vueltos, gastos, otros medios, fiado, abonos y diferencia de arqueo.

**Pendiente:** ventas por horario, margen, exportación, agregados en servidor.
