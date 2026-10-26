---
title: Glosario
status: accepted
owner: producto
updated: 2026-10-25
related: [vision.md, ../architecture/data-model.md]
---

# Glosario

| Término                      | Significado                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Negocio**                  | Unidad de datos y permisos (`businesses/{bid}`). Tiene tipo, moneda (inmutable) y zona horaria.          |
| **Miembro**                  | Usuario dentro de un negocio, con rol, permisos extra y estado (`members/{uid}`).                        |
| **Rol**                      | `admin` o `employee`. Trae un conjunto de permisos.                                                      |
| **Permiso**                  | Capacidad atómica (`sales.create`, `catalog.manage`…). Ver [roles y permisos](roles-and-permissions.md). |
| **Invitación**               | Acceso pendiente para un email; se acepta con el email verificado.                                       |
| **Módulo**                   | Funcionalidad vertical activable por negocio (restaurante, clientes).                                    |
| **Venta**                    | Documento inmutable con snapshot de líneas, totales y pagos.                                             |
| **Anulación**                | Documento `void` nuevo que referencia la venta anulada (`voidedSaleId`).                                 |
| **Línea anulada**            | Línea marcada `voided`; no suma en los totales.                                                          |
| **Snapshot**                 | Copia de nombre, precio e impuesto del producto al vender.                                               |
| **Turno de caja**            | Periodo de una caja (dispositivo) entre apertura y cierre.                                               |
| **Base**                     | Efectivo con el que se abre un turno.                                                                    |
| **Arqueo**                   | Conteo del efectivo al cerrar y comparación con lo esperado.                                             |
| **Gasto**                    | Salida de efectivo durante un turno.                                                                     |
| **Movimiento de inventario** | Registro inmutable de un cambio de stock (venta, anulación, ajuste, compra).                             |
| **Dispositivo / deviceCode** | Código corto y estable de cada caja (`PlatformAdapter.deviceCode()`).                                    |
| **Unidad mínima / `*Minor`** | Dinero en centavos enteros (ADR 0005).                                                                   |
| **bps**                      | Puntos básicos: 1900 bps = 19 %.                                                                         |
| **Pendiente de sincronizar** | Cambio guardado en el dispositivo aún no confirmado por el servidor.                                     |
| **Outbox**                   | Cola propia de operaciones que Firestore no encola (subidas, pagos).                                     |
| **PIN**                      | Clave numérica local para bloquear/desbloquear la pantalla (ADR 0008).                                   |
