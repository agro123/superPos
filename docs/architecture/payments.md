---
title: Pagos
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [../adr/0007-pagos-requieren-servidor.md, ../features/sales.md]
---

# Pagos

Esta fase diseña el **puerto**, no la integración con un proveedor.

## Dominio (`shared/domain/payment.ts`)

- `PaymentMethod`: `cash | card | transfer | wallet | other`.
- `PaymentStatus` y su máquina de estados:

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> authorized
  pending --> captured
  pending --> failed
  authorized --> captured
  authorized --> failed
  captured --> refunded
```

- `summarizeTenders(total, tenders)`: pago mixto; solo el efectivo puede exceder el total (vuelto).
- `worksOffline(method)`: `cash` y `other`.

## Puerto (`shared/infrastructure/payments/`)

```ts
interface PaymentProvider {
  readonly methods: readonly PaymentMethod[];
  readonly requiresNetwork: boolean;
  createPaymentIntent(req: {
    idempotencyKey;
    amount;
    currency;
    method;
    reference;
  }): Promise<Result<PaymentIntent>>;
  confirm(intentId, idempotencyKey): Promise<Result<PaymentIntent>>;
  refund(intentId, idempotencyKey): Promise<Result<PaymentIntent>>;
  getStatus(intentId): Promise<Result<PaymentIntent>>;
}
```

- **Idempotencia**: misma `idempotencyKey` con los mismos datos devuelve el mismo intent; con datos
  distintos, `AppError('idempotency_conflict')` (`PaymentLedger`).
- `CashPaymentProvider`: captura al instante, sin red.
- `MockCardPaymentProvider`: requiere red; `pending → authorized → captured`; montos terminados en
  13 se rechazan para probar errores.

## Flujo futuro con servidor

```mermaid
sequenceDiagram
  participant POS as POS (cliente)
  participant CF as Cloud Function
  participant PSP as Proveedor (Wompi/MP/Stripe)
  POS->>CF: createPaymentIntent(idempotencyKey, saleId, monto)
  CF->>PSP: crear transacción (clave secreta)
  PSP-->>POS: checkout / datáfono
  PSP->>CF: webhook (estado final)
  CF->>CF: actualiza pago y venta (solo servidor)
  CF-->>POS: onSnapshot refleja "captured"
```

El cliente **nunca** guarda claves secretas. Sin conexión no hay pagos electrónicos (ADR 0007).
