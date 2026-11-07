---
title: Seguridad
status: accepted
owner: equipo frontend
updated: 2026-10-25
related:
  [
    ../adr/0002-firebase-sin-backend-propio.md,
    ../adr/0004-permisos-por-rules-vs-custom-claims.md,
    ../adr/0008-pin-de-desbloqueo-en-el-dispositivo.md,
    data-model.md,
  ]
---

# Seguridad

## Principio

**Las Security Rules son la única barrera real.** Todo lo que hace la UI (`usePermission`, `<Can>`,
guardas de ruta, ocultar menús) es experiencia de usuario. Un cliente modificado puede saltarse la
UI, nunca las reglas.

## Security Rules (`firestore.rules`, `storage.rules`)

- Denegación por defecto: lo no declarado está cerrado (probado).
- Funciones `isMember(bid)`, `role(bid)`, `hasPermission(bid, p)`; la tabla de permisos por rol se
  verifica contra el código en `permissions.test.ts`.
- Por colección: pertenencia, permiso, `keys().hasOnly/hasAll`, tipos, enteros para dinero,
  `createdBy == request.auth.uid`, `createdAt/updatedAt == request.time`, campos inmutables.
- **Ventas inmutables** (sin `update`/`delete`) e invariante `total = subtotal + impuestos`.
- Un empleado con `sales.create` solo puede **descontar** stock; `catalog.manage` no toca el stock.
- Máquina de estados de caja validada en el servidor (`validShiftTransition`).
- Alta de negocio en un batch atómico; nadie se agrega como admin a un negocio existente; el
  dueño no puede perder su acceso; nadie cambia su propio rol.
- Invitaciones: solo `users.manage` las crea; el invitado (email **verificado**) recibe exactamente
  el rol invitado.
- **Super administrador** (ADR 0010): custom claim `platformAdmin`, asignado solo con el Admin SDK.
  Lee todo bajo `businesses/**` (lista y conteos de uso) pero no escribe datos operativos; es el
  único que cambia `plan` y `status`. `isMember` exige negocio `active`: bloquear corta el acceso.
- Storage: solo imágenes de producto ≤ 2 MB (`png/jpeg/webp`) de miembros con permiso de catálogo
  (reglas entre servicios con `firestore.get`).
- Pruebas: `pnpm test:rules` (56 casos, incluye `platform.test.ts`: miembro con permiso / no miembro / empleado sin permiso por
  colección) y prueba de mutación manual documentada en [testing](../guides/testing.md).

**Límite conocido (L6)**: las reglas no pueden recorrer listas, así que **no validan el precio de
cada línea** contra el producto. Se valida la forma, enteros y el invariante de totales; la
validación por línea requiere Cloud Functions.

## Configuración y secretos

- Cero secretos en el repo (L4). Variables `VITE_*` en `.env.local` (ignorado por git); plantilla en
  `.env.example`. La config web de Firebase no es secreta.
- App Check (reCAPTCHA Enterprise) se activa con `VITE_APP_CHECK_SITE_KEY`; desactivado con emuladores.
- `readEnv` valida la configuración con Zod y rechaza proyectos `demo-*` sin emuladores.
- El seed solo escribe en emuladores locales y proyectos `demo-*`; aborta ante credenciales de
  servicio (`scripts/seedGuard.ts`, probado) (L13).

## Hosting

`firebase.json` define CSP estricta (`script-src 'self'` + reCAPTCHA), HSTS, `X-Frame-Options: DENY`,
`nosniff`, `Referrer-Policy`, `Permissions-Policy`. No hay túnel ni servidor que exponer (L5).
`style-src 'unsafe-inline'` se mantiene por los estilos en línea de Radix (posicionamiento de popovers).

## Cliente

- Sin `dangerouslySetInnerHTML` (regla de ESLint). Los tickets se imprimen con nodos de texto y
  `sanitizeText` (sin caracteres de control, longitud acotada).
- Errores tipados `AppError` con `code`; los de Firebase se mapean por código, nunca por mensaje (L9).
- PIN: PBKDF2 + sal por usuario, solo en el dispositivo, bloqueo progresivo (ADR 0008) (L2).

## Amenazas y riesgos aceptados

- El super administrador puede leer datos de clientes y ventas de cualquier negocio (necesario
  para soporte y conteos). Mitigación: pocas cuentas con el claim, 2FA y auditoría (pendiente).

| Amenaza                                        | Mitigación                                                                                                                                                        | Riesgo residual                                                                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escalada de privilegios desde el cliente       | Reglas por permiso; nadie edita su propio rol                                                                                                                     | —                                                                                                                                                              |
| Manipulación de precios (L6)                   | Precios del catálogo en la UI; ventas inmutables; invariantes en reglas                                                                                           | Precio por línea sin validar en servidor hasta Cloud Functions                                                                                                 |
| Abuso de la API con la config pública          | App Check en producción                                                                                                                                           | Sin App Check en desarrollo                                                                                                                                    |
| Dispositivo compartido                         | Bloqueo con PIN; cerrar sesión                                                                                                                                    | **La caché de Firestore (IndexedDB) persiste tras cerrar sesión** para permitir trabajo offline; un dispositivo debe pertenecer a un solo negocio de confianza |
| Fuerza bruta de PIN                            | PBKDF2 310k + bloqueo exponencial                                                                                                                                 | PIN de 4–6 dígitos protege la UI, no los datos en disco                                                                                                        |
| Terminal no autorizado o revocado              | Vinculación por QR de un solo uso (5 min, hora del servidor) aprobada por un admin en un batch; reglas exigen terminal activo para sesiones y ventas de empleados | El `terminalId` de la venta lo declara el cliente (ADR 0011): se cierra con un _custom token_ (Cloud Functions)                                                |
| Suplantación entre trabajadores en un terminal | Cuenta individual de Firebase Auth por trabajador; la sesión de trabajo solo la crea su dueño                                                                     | PIN y QR personal pendientes de Cloud Functions                                                                                                                |
| Lecturas costosas en reglas                    | `get()` cacheado por petición                                                                                                                                     | Mejora con custom claims (ADR 0004)                                                                                                                            |

## Lecciones de SmartTable (L1–L15)

| #   | Cómo se cumple                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------- |
| L1  | Puerto `SaleWriter`: venta + `increment(-q)` + movimientos en un `writeBatch`; reglas permiten a ventas solo descontar stock |
| L2  | Firebase Auth email+contraseña; PIN con PBKDF2 + sal + bloqueo                                                               |
| L3  | Denegación por defecto; ninguna lectura sin auth (probado)                                                                   |
| L4  | Config por `VITE_*`; sin secretos                                                                                            |
| L5  | Hosting estático; sin servidor propio                                                                                        |
| L6  | Precios del catálogo, ventas inmutables; validación por línea pendiente de Functions                                         |
| L7  | `calculateTotals` puro, excluye anulados (probado)                                                                           |
| L8  | `defineStateMachine`: venta, caja, pago, comanda, mesa; caja también en reglas                                               |
| L9  | `AppError` + `mapFirebaseError` por código                                                                                   |
| L10 | `Money` entero; reglas exigen `int`                                                                                          |
| L11 | `Timestamp`/ISO UTC; zona del negocio solo para mostrar                                                                      |
| L12 | Zod como esquema único; reglas probadas contra el emulador                                                                   |
| L13 | `.gitignore` de datos locales; seed solo a emulador                                                                          |
| L14 | ESLint estricto (`--max-warnings 0`), `max-lines` 250 por componente, CI                                                     |
| L15 | Escuchas filtradas por `businessId` bajo `businesses/{bid}` y protegidas por reglas                                          |
