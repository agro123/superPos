---
title: Feature: customers
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [catalog.md]
---

# customers — clientes (módulo activable)

**Estado:** clientes, cliente en la venta y cuentas fiadas (cartera y abonos).

| Pantalla | Ruta         | Permiso                                                            |
| -------- | ------------ | ------------------------------------------------------------------ |
| Clientes | `/customers` | `customers.view` (editar: `customers.manage`) + módulo `customers` |

- Nombre, cédula/NIT, teléfono, email, notas. Escrituras offline con "pendiente de sincronizar".

- **Cliente en la venta** (opcional): en el carrito, "Agregar cliente" abre el selector con búsqueda
  y alta rápida (`CustomerPickerDialog`). Es por orden (`CartOrder.customerId`).
- **Fiado** (`credit`): medio de pago solo con un cliente registrado. La venta guarda `creditMinor`;
  las reglas exigen que corresponda a un pago `credit`, que el cliente exista y que el módulo
  esté activo.
- **Saldo** = ventas fiadas vigentes − anulaciones − abonos (`customerBalances`, puro). Se calcula
  de documentos inmutables: no hay un contador editable. Al elegir un cliente que debe, el POS
  muestra "X tiene un saldo pendiente de $Y" (aviso en el carrito y toast).
- **Cartera** en Clientes: columna "Saldo fiado" (con fecha del último fiado), filtro "Solo clientes
  con saldo pendiente" y "Registrar abono" → `creditPayments/{id}` (inmutable), que entra a la caja
  abierta de este dispositivo (lo exigen las reglas).

**Pendiente:** historial por cliente; límite de crédito; agregados en servidor si la cartera crece
(hoy se leen hasta 2000 ventas fiadas y 2000 abonos).
