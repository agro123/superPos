---
title: ADR 0014 — Configuración inicial guiada y tour
status: proposed
owner: equipo frontend
updated: 2026-11-07
related: [../features/setup.md, ../features/business.md]
---

# ADR 0014 — Configuración inicial guiada y tour

## Contexto

La propuesta promete que "el sistema adapta categorías y opciones al tipo de tienda" y apunta a
personas poco digitales. Hasta ahora, tras crear el negocio, el dueño llegaba a una app vacía.

## Decisión propuesta

- **Presets por tipo** como datos de dominio puros (`presetFor`), no en Firestore: versionados con el
  código, probados y fáciles de ampliar.
- **Estado del asistente** en `settings/setup` (`completedSteps`, `skippedSteps`, `dismissedAt`,
  `completedAt`), creado en el mismo batch que el negocio. Solo los negocios nuevos se redirigen.
- **Tour por persona** en `tourProgress/{uid}`: cada miembro escribe solo el suyo (reglas).
- Componente `TourOverlay` propio (sin librería externa), sobre Radix Dialog.

## Alternativas consideradas

- **Guardar el "tour visto" en `localStorage`**: se repetiría en cada dispositivo.
- **Librería de tours (driver.js, react-joyride)**: peso extra y estilos fuera del sistema de diseño.
- **Asistente obligatorio**: bloquearía a quien quiere vender ya; se puede posponer.

## Consecuencias

- Las pruebas e2e y el seed marcan los negocios de ejemplo como configurados y el tour como visto.
- Agregar un tipo de negocio exige su preset (lo verifica la prueba de presets).

## Estado

Propuesto.
