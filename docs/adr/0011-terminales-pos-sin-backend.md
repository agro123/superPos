---
title: ADR 0011 — Terminales POS y sesiones de trabajo sin backend
status: proposed
owner: equipo frontend
updated: 2026-11-06
related:
  [
    ../features/terminals.md,
    0002-firebase-sin-backend-propio.md,
    0008-pin-de-desbloqueo-en-el-dispositivo.md,
  ]
---

# ADR 0011 — Terminales POS y sesiones de trabajo sin backend

## Contexto

Se pide que un administrador autorice celulares o tablets como terminales y que, en ellos, cada
trabajador inicie sesión con contraseña, PIN o un QR personal. El proyecto no tiene backend propio
(ADR 0002) y el proyecto real está en el plan gratuito (Spark), sin Cloud Functions.

## Decisión propuesta

- **Terminal = usuario anónimo de Firebase Auth** en una segunda instancia de Firebase, con un
  `deviceUuid` local. `posTerminals/{uid anónimo}`: las reglas reconocen al terminal por
  `request.auth.uid` sin consultas extra.
- **Vinculación** con un código aleatorio de corta vida; en Firestore va solo su SHA-256 como id.
  La aprobación y el alta del terminal van en el mismo `writeBatch`, exigido por las reglas.
- **Trabajadores**: cuenta individual de Firebase Auth (la de las invitaciones, ADR 0004), con
  contraseña. Se reutilizan `members`; no hay colección `employees` nueva.
- **Sesión de trabajo** en `terminalSessions`; ventas con `terminalId` validado en reglas.
- **PIN y QR personal no se implementan** sin servidor (ver Consecuencias).

## Alternativas consideradas

- **Cloud Functions** (recomendada): funciones _callable_ que verifican PIN o token QR y emiten un
  _custom token_ con el claim `terminalId`. Cumple todos los requisitos; requiere plan Blaze.
- **PIN/QR verificados en el cliente**: el hash tendría que ser legible por el terminal; un PIN se
  rompe por fuerza bruta y el token QR equivaldría a una contraseña. Descartado (ADR 0008).
- **Cuenta compartida del terminal**: prohibido por el requerimiento (identidad individual).

## Consecuencias

- Solo hay login con contraseña. PIN y QR personal quedan pendientes de Cloud Functions.
- `terminalId` en una venta lo declara el cliente: las reglas validan que el terminal exista y esté
  activo, no que la venta salga físicamente de él. Con un _custom token_ se leería del token.
- Un cliente modificado podría abrir dos sesiones activas en un terminal; las reglas solo
  garantizan que cada sesión sea del propio trabajador y de un terminal activo.

## Estado

Propuesto. Implementado sin backend; la migración a Cloud Functions es la mejora recomendada.
