---
title: ADR 0013 — Asesor con I.A. (Gemini) desde el cliente
status: proposed
owner: equipo frontend
updated: 2026-11-07
related:
  [
    ../features/reports.md,
    0002-firebase-sin-backend-propio.md,
    0010-super-administrador-de-plataforma.md,
  ]
---

# ADR 0013 — Asesor con I.A. (Gemini) desde el cliente

## Contexto

Se pide un asesor que recomiende qué hacer a partir de los reportes, con la API y el modelo de
Gemini configurables por variables de entorno, solo para el plan premium. No hay backend (ADR 0002).

## Decisión propuesta

- Llamada directa a la API REST de Gemini desde el navegador (`shared/infrastructure/ai/gemini.ts`),
  con `VITE_GEMINI_API_KEY` y `VITE_GEMINI_MODEL`. Antes de habilitar el botón se consulta el modelo
  (`GET models/{modelo}`): si no existe o no admite `generateContent`, se muestra el error y se
  bloquea el análisis.
- Solo se envían **cifras agregadas** (totales, horas, mezcla de pagos, márgenes, productos bajos de
  stock); nunca datos de clientes. Los trabajadores van como "Trabajador N".
- La respuesta se pide en JSON con `responseSchema` y se valida con Zod antes de mostrarla.
- El acceso premium (`business.plan`) se controla en la app.

## Riesgos aceptados

- **La clave queda en el bundle público** (todo `VITE_*` lo está). Mitigación: restringir la clave por
  dominio (HTTP referrer) y por API en Google Cloud, con cuota baja. Es una excepción consciente a
  L4 para el prototipo.
- **El plan premium no se puede imponer** sin servidor: un cliente modificado podría llamar a Gemini
  con la clave expuesta.

## Alternativa recomendada para producción

Firebase AI Logic (o una Cloud Function) con App Check: la clave no sale del servidor, el plan se
verifica en el backend y el uso queda medido por negocio.

## Estado

Propuesto.
