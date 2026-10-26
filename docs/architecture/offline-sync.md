---
title: Estrategia offline y sincronización
status: accepted
owner: equipo frontend
updated: 2026-10-25
related:
  [../adr/0003-firestore-offline-y-limites-de-transacciones.md, data-model.md, ../features/sales.md]
---

# Estrategia offline y sincronización

Requisito central: **vender sin conexión** y sincronizar solo al volver.

## Piezas

| Pieza                          | Dónde                                         | Qué hace                                                                                                                                                                |
| ------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caché persistente de Firestore | `shared/infrastructure/firebase/app.ts`       | `persistentLocalCache` + `persistentMultipleTabManager`: lecturas desde IndexedDB y escrituras encoladas                                                                |
| `trackWrite`                   | `shared/infrastructure/offline/trackWrite.ts` | Cuenta escrituras sin confirmar **sin bloquear la UI**; publica rechazos (p. ej. reglas) como toast                                                                     |
| `watchQuery` / `watchDoc`      | `shared/infrastructure/firebase/firestore.ts` | `onSnapshot` con `includeMetadataChanges`; marca `pendingSync` por fila y expone `fromCache`                                                                            |
| Outbox propio                  | `shared/infrastructure/offline/outbox.ts`     | Lo que Firestore no encola (Storage, pagos, Functions): IndexedDB (`idb`), reintentos con backoff exponencial (2 s → 5 min, 8 intentos), idempotencia por `operationId` |
| Indicador global               | `shared/domain/sync.ts` + `SyncStatusBadge`   | `en línea / sin conexión / sincronizando N / error` a partir de `navigator.onLine`, escrituras pendientes, `waitForPendingWrites` al arrancar y contadores del outbox   |
| Service Worker                 | `vite.config.ts` (Workbox)                    | Precache del app shell y chunks; `StaleWhileRevalidate` para imágenes de Storage y fuentes; _fallback_ de navegación a `index.html`                                     |
| Borradores                     | `features/sales/application/cartStore.ts`     | `persist` de Zustand sobre IndexedDB (`idbStorage`): el carrito sobrevive a recargas y cierres                                                                          |
| Sesión                         | Firebase Auth con `indexedDBLocalPersistence` | Sin red se sigue con el último usuario autenticado                                                                                                                      |

## Reglas para escribir código offline

1. **Nada de `runTransaction`** en flujos que deban funcionar sin red. Usar `writeBatch` + `increment`.
2. **IDs en cliente** antes de escribir.
3. **No esperar** (`await`) escrituras en la UI: usar `trackWrite` y responder de inmediato
   ("Guardado en este dispositivo…"). Excepción: operaciones que _requieren_ red (crear negocio,
   aceptar invitación, login) y lo dicen en la UI.
4. Operaciones del outbox **idempotentes** (pueden repetirse tras un fallo parcial).
5. Probar con la red desactivada (DevTools → Offline, o `pnpm test:e2e`).

## Primera instantánea solo-caché

Con conexión, la primera instantánea de una consulta puede venir de la caché y estar incompleta
(p. ej. al ampliar un rango de fechas). `watchQuery` espera hasta 1,5 s la respuesta del servidor
antes de mostrarla; **sin conexión entrega la caché de inmediato**. Para documentos, `LiveDoc.fromCache`
permite distinguir "no existe" de "no está en caché" (las guardas muestran "sin conexión y sin datos").

## Conflictos por entidad

| Entidad                           | Estrategia                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Ventas                            | Solo inserción e inmutables: sin conflictos. Anular = documento nuevo `void`.              |
| Stock                             | `increment()` conmutativo; puede quedar negativo tras ventas offline concurrentes (alerta) |
| Movimientos de inventario, gastos | Solo inserción                                                                             |
| Catálogo, clientes, configuración | Última escritura gana (por campo, con `updateDoc`)                                         |
| Miembros                          | Última escritura gana; solo `users.manage`                                                 |
| Turnos de caja                    | Un turno por dispositivo (ADR 0009, propuesto); transiciones validadas en reglas           |

## Comportamiento de sesión sin conexión

- **Un login nuevo requiere red** (Firebase Auth). La pantalla de login lo avisa y deshabilita el envío.
- Si ya hubo sesión en el dispositivo, la app abre sin red con ese usuario y su negocio en caché.
- Crear negocio y aceptar invitaciones requieren red (validan reglas entre documentos).

## Limitaciones conocidas

- Una escritura rechazada por las reglas al sincronizar se revierte localmente y se avisa con un
  toast; no hay todavía una bandeja de "cambios rechazados".
- La caché de Firestore crece con el uso; no hay política de limpieza (por defecto 40 MB).
- Cerrar sesión no borra la caché local (ver [security.md](security.md)).
