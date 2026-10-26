---
title: ADR 0002 — Firebase como backend, sin servidor propio
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/security.md, ../architecture/overview.md]
---

# ADR 0002 — Firebase como backend, sin servidor propio

## Contexto

SmartTable usaba Express + SQLite + Electron con un túnel público activado por defecto (L5), un
secreto JWT fijo (L4) y endpoints sin autenticación (L3). El prototipo necesita multi-negocio,
tiempo real y funcionamiento offline con un equipo pequeño.

## Decisión

- Auth, Firestore, Storage, Hosting y App Check de Firebase son el backend. No hay servidor propio.
- **Las Security Rules son la única barrera de autorización** (`firestore.rules`, `storage.rules`),
  con denegación por defecto y pruebas en `tests/rules/`.
- La configuración web va en variables `VITE_*` (no es secreta). App Check (reCAPTCHA Enterprise)
  se activa con `VITE_APP_CHECK_SITE_KEY`.
- `functions/` queda **reservado** para Cloud Functions (pagos, numeración fiscal, custom claims).
- Hosting estático con HTTPS y cabeceras de seguridad (CSP, HSTS…) en `firebase.json`.

## Alternativas consideradas

- **API propia (Node/Express)** — reintroduce superficie de ataque, despliegue y sincronización offline a mano.
- **Supabase** — buena opción, pero su soporte offline en cliente es menor que la caché persistente de Firestore.

## Consecuencias

- La validación de negocio que no cabe en reglas (precio por línea, numeración fiscal) requiere
  Cloud Functions (ADR 0006 y 0007).
- Cada lectura en reglas (`get()`) tiene costo; ver ADR 0004.
- Desarrollo y pruebas 100 % locales con el Emulator Suite y proyectos `demo-*`.

## Estado

Aceptado.
