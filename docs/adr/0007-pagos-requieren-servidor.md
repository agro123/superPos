---
title: ADR 0007 — Los pagos electrónicos requieren servidor
status: proposed
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/payments.md]
---

# ADR 0007 — Los pagos electrónicos requieren servidor

## Contexto

El prototipo debe admitir efectivo, tarjeta, transferencia y billeteras, con pagos mixtos. Los
proveedores (Wompi, Mercado Pago, Stripe…) usan claves secretas y confirman por webhooks.

## Decisión propuesta

- El cliente solo conoce el puerto `PaymentProvider` (`createPaymentIntent`, `confirm`, `refund`,
  `getStatus`, todos idempotentes) y la máquina de estados `paymentStatusMachine`.
- Implementaciones actuales: `CashPaymentProvider` (offline) y `MockCardPaymentProvider` (simulado).
- Los pagos electrónicos reales se crean y confirman en **Cloud Functions** (claves secretas en
  Secret Manager) y su estado final llega por **webhook** del proveedor.
- **Sin conexión**: solo `cash` y `other` (`worksOffline`). Los electrónicos se rechazan en la UI;
  si en el futuro se encolan, quedan `pending` en el outbox y la venta no se cierra hasta capturar.

## Alternativas consideradas

- **SDK del proveedor en el cliente con clave pública** — algunos lo permiten para tokenizar, pero
  la captura y el reembolso siguen requiriendo clave secreta.

## Consecuencias

- La venta guarda `payments[]` con método, monto, estado y referencia.
- Requiere `functions/` y elegir proveedor antes del Prompt 2 de pagos.

## Estado

Propuesto.
