---
title: Feature: platform
status: proposed
owner: equipo frontend
updated: 2026-10-26
related: [../adr/0010-super-administrador-de-plataforma.md, business.md]
---

# platform — super administrador

**Estado:** implementado (lista, alta, edición, bloqueo, borrado lógico, plan y uso).

## Acceso

- Usuarios con el custom claim `platformAdmin` (en el emulador: `soporte@superpos.test`).
- Ruta `/platform` (fuera de `RequireBusiness`); guarda `RequirePlatformAdmin` (solo UX).
- Si no tiene negocios propios, entra directo a `/platform`; si los tiene, aparece
  "Administración de la plataforma" en el menú de usuario.

## Pantallas

| Ruta                               | Contenido                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/platform`                        | Resumen (activos/bloqueados, premium, bloqueados), tabla con búsqueda, filtro por estado (los eliminados se ocultan por defecto) y alta de negocio |
| `/platform/businesses/:businessId` | Datos, plan, edición (nombre, zona, plan), estado con confirmación y uso por colección                                                             |

## Reglas de negocio

- Alta: negocio + configuración + invitación de admin para el dueño en un batch; requiere red.
- Edición y cambios de estado: optimistas (`trackWrite`), validados con `businessStatusMachine`.
- Bloqueado/eliminado: los miembros ven "Este negocio está bloqueado/eliminado" y no operan.
- Uso: `count()` del servidor sobre las colecciones de `USAGE_COLLECTIONS`; solo en línea.
- Plan: `free | premium`; aún no habilita funciones (por definir).

## Pendientes

- Purga física de negocios eliminados (Cloud Function).
- Funciones premium y su validación en reglas.
- Script de operador para asignar/quitar el claim en producción.
- Fijar `ownerUid` cuando el dueño invitado acepta.
