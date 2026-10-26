---
title: Documentación de SuperPOS
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../CLAUDE.md, ../README.md]
---

# Documentación de SuperPOS

## Orden de lectura

1. [Visión del producto](product/vision.md) y [glosario](product/glossary.md)
2. [Arquitectura: visión general](architecture/overview.md) → [estructura de carpetas](architecture/folder-structure.md)
3. [Modelo de datos](architecture/data-model.md) → [roles y permisos](product/roles-and-permissions.md) → [seguridad](architecture/security.md)
4. [Offline y sincronización](architecture/offline-sync.md)
5. [Sistema de diseño](design-system/principles.md): [tokens](design-system/tokens.md), [atomic design](design-system/atomic-design.md), [componentes](design-system/components.md)
6. Guías: [primeros pasos](guides/getting-started.md), [pruebas](guides/testing.md), [agregar una feature](guides/adding-a-feature.md)

## Mapa

| Carpeta          | Contenido                                                      |
| ---------------- | -------------------------------------------------------------- |
| `product/`       | Qué es, para quién, términos, permisos                         |
| `architecture/`  | Capas, datos, seguridad, offline, pagos, escritorio            |
| `design-system/` | Principios, tokens, niveles y componentes                      |
| `features/`      | Una página por feature: estado, entidades, permisos, pantallas |
| `guides/`        | Recetas prácticas                                              |
| `adr/`           | Decisiones de arquitectura ([plantilla](adr/0000-template.md)) |

## Estado

| Feature    | Estado                     | Doc                                  |
| ---------- | -------------------------- | ------------------------------------ |
| auth       | implementado               | [auth](features/auth.md)             |
| business   | implementado               | [business](features/business.md)     |
| users      | implementado               | [users](features/users.md)           |
| catalog    | CRUD implementado          | [catalog](features/catalog.md)       |
| customers  | CRUD implementado          | [customers](features/customers.md)   |
| settings   | implementado               | [settings](features/settings.md)     |
| reports    | implementado (lectura)     | [reports](features/reports.md)       |
| sales      | UI + dominio; sin registro | [sales](features/sales.md)           |
| cash       | UI + dominio; sin lógica   | [cash](features/cash.md)             |
| inventory  | solo lectura               | [inventory](features/inventory.md)   |
| restaurant | marcador                   | [restaurant](features/restaurant.md) |
| platform   | implementado (super admin) | [platform](features/platform.md)     |

## ADRs

| #                                                                | Decisión                                    | Estado   |
| ---------------------------------------------------------------- | ------------------------------------------- | -------- |
| [0001](adr/0001-stack.md)                                        | Stack técnico                               | accepted |
| [0002](adr/0002-firebase-sin-backend-propio.md)                  | Firebase sin backend propio                 | accepted |
| [0003](adr/0003-firestore-offline-y-limites-de-transacciones.md) | Offline y límites de transacciones          | accepted |
| [0004](adr/0004-permisos-por-rules-vs-custom-claims.md)          | Permisos en reglas (custom claims a futuro) | accepted |
| [0005](adr/0005-dinero-en-enteros.md)                            | Dinero en enteros                           | accepted |
| [0006](adr/0006-numeracion-de-ventas-offline.md)                 | Numeración de ventas offline                | proposed |
| [0007](adr/0007-pagos-requieren-servidor.md)                     | Pagos requieren servidor                    | proposed |
| [0008](adr/0008-pin-de-desbloqueo-en-el-dispositivo.md)          | PIN solo en el dispositivo                  | accepted |
| [0010](adr/0010-super-administrador-de-plataforma.md)            | Super administrador de la plataforma        | proposed |
| [0009](adr/0009-turnos-de-caja.md)                               | Un turno de caja por dispositivo            | proposed |
