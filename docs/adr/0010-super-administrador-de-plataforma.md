---
title: ADR 0010 — Super administrador de la plataforma
status: proposed
owner: equipo frontend
updated: 2026-10-26
related:
  [
    ../features/platform.md,
    0004-permisos-por-rules-vs-custom-claims.md,
    ../architecture/security.md,
  ]
---

# ADR 0010 — Super administrador de la plataforma

## Contexto

Se necesita un rol fuera de los negocios que administre todas las cuentas: crear, editar,
bloquear y eliminar negocios, ver su plan (gratis/premium) y su uso. No hay backend propio
(ADR 0002) y los permisos por negocio viven en `members` (ADR 0004). Las funciones premium aún no
están definidas.

## Decisión propuesta

- **Identidad:** custom claim `platformAdmin: true` en el token de Firebase Auth. Solo lo asigna el
  Admin SDK (seed en el emulador; en producción un script/consola de operador). Nadie puede
  otorgárselo escribiendo en Firestore. A diferencia de los roles por negocio (ADR 0004), es global
  y cambia muy poco, que es justo el caso de uso de los claims.
- **Datos:** `plan` (`free | premium`) y `status` (`active | blocked | deleted`) en
  `businesses/{bid}`. Solo `isPlatformAdmin()` los cambia; el onboarding crea `free` + `active`.
  Los negocios previos sin estos campos se leen como `free`/`active` (default en Zod y
  `data.get(..., 'active')` en reglas).
- **Bloqueo en reglas:** `isMember(bid)` exige además `businessOperational(bid)`. Un negocio
  bloqueado o eliminado no lee ni escribe nada salvo su propio documento (para mostrar el aviso).
- **Eliminar = borrado lógico** (`status: deleted`), reversible. Borrar subcolecciones desde el
  cliente es lento, no atómico y destruiría ventas (L6). La purga física queda para una Cloud
  Function programada (pendiente, junto con ADR 0007).
- **Ciclo de vida:** `businessStatusMachine` (`active ↔ blocked`, `active|blocked → deleted`,
  `deleted → active`), replicada en `validBusinessStatusTransition` de las reglas.
- **Uso:** agregaciones `count()` del servidor por colección (no descargan documentos; 1 lectura
  por cada 1000). Requiere que el super admin tenga **lectura** de todo el negocio: las reglas no
  distinguen "contar" de "leer". El super admin no escribe datos operativos.
- **Alta por la plataforma:** el negocio nace sin dueño (`ownerUid: null`) con una invitación de
  admin al email del dueño; la acepta con el flujo normal de invitaciones.

## Alternativas consideradas

- **Colección `platformAdmins/{uid}`** — editable desde la consola, pero cada regla pagaría un
  `get()` extra y un error de reglas podría permitir autoasignarse.
- **Contadores denormalizados** — más baratos de leer, pero requieren Functions o escrituras extra
  en cada operación offline.
- **Borrado físico desde el cliente** — descartado (ver arriba).

## Consecuencias

- El super admin puede leer datos de clientes y ventas de todos los negocios: requiere política de
  acceso y auditoría del equipo (riesgo aceptado, ver security.md).
- Ventas hechas sin conexión en un negocio que se bloquea quedan rechazadas al sincronizar.
- Cambiar el claim exige que el usuario refresque su token (cerrar e iniciar sesión).
- Si un negocio creado por la plataforma no tiene dueño, otro admin podría quitarle el rol al
  invitado; pendiente: fijar `ownerUid` al aceptar.
- Cuando se definan las funciones premium, las reglas podrán consultar `plan` en cada colección.
