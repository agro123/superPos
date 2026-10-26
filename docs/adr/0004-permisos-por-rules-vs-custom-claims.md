---
title: ADR 0004 — Permisos en Security Rules leyendo `members` (custom claims a futuro)
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../product/roles-and-permissions.md, ../architecture/security.md]
---

# ADR 0004 — Permisos en Security Rules leyendo `members`

## Contexto

La autorización es por permisos (`ROLE_PERMISSIONS` + `extraPermissions`), multi-negocio. Las
reglas necesitan saber rol y permisos del usuario en cada negocio.

## Decisión

- Las reglas leen `businesses/{bid}/members/{uid}` con `get()`/`exists()` en funciones
  `isMember`, `role` y `hasPermission`. Firestore cachea los `get()` del mismo documento por petición.
- La tabla de permisos por rol se **duplica** en `firestore.rules`; `permissions.test.ts` falla si
  diverge de `ROLE_PERMISSIONS`.
- La UI usa lo mismo (`usePermission`, `<Can>`, guardas) solo como experiencia de usuario.

## Alternativas consideradas

- **Custom claims** (`request.auth.token.roles[bid]`) asignados por Cloud Functions — sin lecturas
  extra por regla, pero requieren servidor, refresco de token y tienen límite de 1000 bytes
  (problema con muchos negocios por usuario).

## Consecuencias

- Cada operación protegida cuesta al menos 1 lectura de `members` (límite: 10 `get` por petición
  simple, 20 en batch).
- **Mejora futura**: cuando exista `functions/`, sincronizar un claim compacto
  (`{ bid: rol }`) para los negocios activos y dejar `get()` solo para `extraPermissions`.

## Estado

Aceptado; mejora con custom claims pendiente de Cloud Functions.
