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

- **Para decidir** (`domain/insights.ts`, puro): ventas por hora del día en la zona del negocio
  (con hora pico), mezcla de medios de pago (efectivo neto de vuelto, fiado aparte), margen
  estimado por producto con el costo **actual** del catálogo (y qué parte de lo vendido cubre) y
  exportación CSV de las ventas del periodo (con BOM para Excel).
- Gráficos: `BarChart` genérico de una serie (tooltip por ratón y teclado, vista de tabla).

- Pestañas: **Ventas** (resumen, por día, top, por hora, medios de pago, CSV), **Ganancia**
  (`profitReport`: margen por producto y categoría, productos bajo el costo, sin costo, gastos de
  caja, merma por ajustes valorada al costo y resultado estimado) y **Trabajadores**
  (`workerPerformance` + caja por trabajador).
- **Exportar:** Excel (`.xlsx` propio con `fflate`, una hoja por sección, montos como números) y PDF
  (`jspdf` bajo demanda, tablas con salto de página).

- **Asesor I.A.** (pestaña, plan premium; ADR 0013): al pulsar "Analizar con I.A." envía a Gemini
  cifras agregadas del periodo (sin datos de clientes; trabajadores como "Trabajador 1…") y pide un
  JSON con resumen y recomendaciones priorizadas (`adviceSchema`, validado con Zod). Clave y modelo
  en `VITE_GEMINI_API_KEY` / `VITE_GEMINI_MODEL`; al abrir la pestaña se verifica el modelo
  (`checkGeminiModel`) y, si no existe o no genera contenido, se muestra el error y se bloquea.

**Pendiente:** preguntas libres al asesor, llamada a la I.A. desde un servidor, agregados en servidor.
