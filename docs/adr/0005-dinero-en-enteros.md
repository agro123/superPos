---
title: ADR 0005 — Dinero en enteros de la unidad mínima
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/data-model.md, ../features/sales.md]
---

# ADR 0005 — Dinero en enteros de la unidad mínima

## Contexto

SmartTable guardaba dinero como `REAL` (L10) y sumaba ítems cancelados (L7).

## Decisión

- Tipo `Money` (entero _branded_) en **unidades mínimas ISO 4217** (centavos; COP también usa 2).
  Campos persistidos con sufijo `Minor` (`priceMinor`, `totalMinor`).
- Aritmética exacta en `shared/domain/money.ts`: `roundDiv` (half away from zero), cantidades con
  hasta 3 decimales en milésimas enteras, tasas en puntos básicos (1900 = 19 %).
- `calculateTotals` es pura, redondea el impuesto por línea y excluye líneas anuladas.
- El formateo vive solo en la UI (`formatMoney`, `Intl.NumberFormat`); COP se muestra sin centavos
  salvo que existan.
- **La moneda del negocio es inmutable** (las reglas no permiten cambiarla).
- Zod valida enteros en lectura y escritura; las reglas exigen `int` y `>= 0`.

## Alternativas consideradas

- **Decimal.js / big.js** — innecesario con enteros seguros (±9·10¹⁵ centavos).
- **Guardar pesos enteros para COP** — rompe monedas con decimales y la conversión futura.

## Consecuencias

- Cambiar de moneda exige crear otro negocio.
- Pruebas unitarias cubren redondeo y casos de coma flotante (`0.1 + 0.2`, `1.005`).

## Estado

Aceptado.
