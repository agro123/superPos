# functions/ (reservado)

Carpeta reservada para **Cloud Functions for Firebase**. No se usa en esta fase (ADR 0002).

Casos previstos, en orden de prioridad:

1. **Pagos electrónicos** (ADR 0007): crear intents con la clave secreta del proveedor, recibir
   webhooks y actualizar el pago/venta. Claves en Secret Manager.
2. **Numeración fiscal** de ventas al sincronizar (ADR 0006).
3. **Validación de precios por línea** de las ventas contra el catálogo (límite de las reglas, L6).
4. **Custom claims** de rol por negocio para abaratar las reglas (ADR 0004).
5. **Cambio rápido de empleado** con custom tokens tras verificar el PIN en el servidor (ADR 0008).

Al crearla: `firebase init functions` (TypeScript), agregar `"functions"` a `firebase.json` y al
emulador, sumar el paquete al workspace de pnpm, y llamar a las funciones desde el cliente a través
del outbox (`shared/infrastructure/offline/outbox.ts`) para que funcionen con reintentos.
