---
title: Feature: sales
status: draft
owner: equipo frontend
updated: 2026-10-25
related: [../adr/0003-firestore-offline-y-limites-de-transacciones.md, ../adr/0006-numeracion-de-ventas-offline.md, ../architecture/payments.md]
---

# sales — punto de venta e historial

**Estado:** registra ventas offline-first; exige turno de caja abierto en el dispositivo.

| Pantalla                                  | Ruta     | Permiso        |
| ----------------------------------------- | -------- | -------------- |
| Punto de venta                            | `/pos`   | `sales.create` |
| Historial y detalle (impresión de ticket) | `/sales` | `sales.view`   |

- POS: búsqueda (F2), categorías, grilla, lector de código de barras, carrito persistido en
  IndexedDB por negocio, `PaymentSheet` con numpad, pago mixto/vuelto (`summarizeTenders`), F9 cobrar.
  Sin conexión solo efectivo y "otro".
- Órdenes simultáneas: pestañas en el carrito (`domain/orders.ts`, máx. `MAX_OPEN_ORDERS`), cada una
  con sus líneas; cerrar una orden con productos pide confirmación. El store migra el carrito único (v1).
- Stock: productos agotados deshabilitados en la grilla; el carrito no supera el stock disponible
  (`remainingStock`, `maxQuantity` por línea) y avisa con un toast.
- Dominio listo: `calculateTotals`, carrito puro, `saleSchema` (snapshot inmutable), `saleStatusMachine`,
  `formatSaleNumber`, `stockDecrementsFor`, puertos `SaleReader` (implementado) y `SaleWriter` (L1).
- Historial: ventas en tiempo real con "Anulada" (por documentos `void`) y "Pendiente de sincronizar".

- Cobro: `buildCheckout` (puro) arma la venta; `saleWriter.record` escribe venta + `increment(-q)` +
  `inventoryMovements` en un `writeBatch` sin `await`. Número `<deviceCode>-<secuencia>` con la
  secuencia local en IndexedDB (ADR 0006). Tarjeta/transferencia se registran como `captured`
  (datáfono externo).

- **Pago mixto:** en el cobro se agregan pagos (método + monto) hasta cubrir el total; solo el
  efectivo puede exceder (vuelto). El fiado (`credit`) aparece si la orden tiene cliente.
- **Anulación:** desde el detalle de la venta (permiso `sales.void`), con motivo. `buildVoid` (puro)
  crea `sales/void-<id>`: id determinista, así las reglas impiden anular dos veces. Mismo turno,
  pagos y fiado que la original (caja, reportes y saldos la restan); `terminalId` de quien anula.
  `saleWriter.recordVoid` devuelve el stock (`increment(+q)`) con movimientos `void` en el mismo batch.

- **Compartir ticket:** imagen PNG (canvas, 80 mm) o PDF (jsPDF bajo demanda) con la hoja nativa de
  compartir si el navegador admite archivos (si no, se descarga), y el ticket en texto por WhatsApp
  (`wa.me`, al número del cliente si lo tiene) o correo con el proveedor configurado.
- Cada línea guarda `unitCostMinor` (costo del catálogo al vender) para el margen exacto.

**Pendiente:** pagos electrónicos integrados (ADR 0007) y facturación electrónica.
