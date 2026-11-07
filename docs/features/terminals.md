---
title: Feature: terminals
status: draft
owner: equipo frontend
updated: 2026-11-06
related: [../adr/0011-terminales-pos-sin-backend.md, users.md, ../architecture/security.md]
---

# terminals — terminales POS y sesiones de trabajo

**Estado:** implementado sin backend (ADR 0011): vinculación por QR, administración de terminales,
selección de trabajador con contraseña, historial de sesiones e inactividad. **PIN y QR personal
no están implementados**: requieren Cloud Functions (ver "Limitaciones").

| Pantalla              | Ruta                  | Permiso                        |
| --------------------- | --------------------- | ------------------------------ |
| Terminal POS          | `/terminal`           | ninguno (identidad anónima)    |
| Terminales y sesiones | `/settings/terminals` | `users.manage` (administrador) |

## Cómo funciona

1. **Identidad de la instalación.** En el primer uso, la PWA genera un `deviceUuid`
   (`crypto.randomUUID`, guardado en IndexedDB) e inicia una sesión **anónima** de Firebase Auth
   en una segunda instancia de Firebase (`getTerminalFirebase`). Así el login de un trabajador en
   la instancia principal no borra la identidad del terminal. El UUID identifica la instalación,
   no el aparato: si se borran los datos del navegador o se reinstala, hay que vincular de nuevo.
2. **Vinculación por QR.** "Registrar dispositivo" genera un código aleatorio de 8 caracteres
   (`generatePairingCode`) y crea `terminalPairingRequests/{sha256(código)}`. El QR contiene solo
   `SUPERPOS-PAIR:<código>`: ni credenciales ni datos del negocio. El código no se guarda en
   Firestore (solo su hash).
3. **Aprobación explícita.** Un admin en Configuración → Terminales escanea el QR (cámara con
   `BarcodeDetector`) o teclea el código. Encontrar la solicitud **no** autoriza nada: el admin
   confirma el negocio, pone un nombre ("Caja principal") y los minutos de inactividad. Un único
   `writeBatch` aprueba la solicitud y crea (o reactiva) `posTerminals/{uid anónimo}`.
4. **Selección de trabajador.** El terminal activo lee los miembros habilitados (nombre y email
   enmascarado). El trabajador elige su perfil y entra con **su propia cuenta** de Firebase Auth
   (contraseña). Se crea `terminalSessions/{id}` con trabajador, terminal, método e inicio.
5. **Operación.** Las ventas llevan `terminalId`. **Cambiar de trabajador** o **Cerrar sesión**
   cierran la sesión de trabajo (`closed`, con `endedAt`), cierran Auth, limpian la caché de
   TanStack Query y vuelven a la selección.
6. **Inactividad y revocación.** `useTerminalSessionGuard` cierra la sesión tras
   `idleLockMinutes` sin actividad, o en cuanto el admin desactiva o revoca el terminal.

## Qué protegen las reglas (no la UI)

- Solicitud: la crea un usuario anónimo, para sí mismo, con `createdAt == request.time`. Vence a los
  5 min **según la hora del servidor**; uso único (`pending` → `approved`). Sin `list`.
- Aprobar exige `users.manage` en el negocio elegido y crear el terminal **en el mismo batch**; el
  terminal no se crea sin una solicitud aprobada en esa escritura. El QR solo no autoriza nada.
- `posTerminals`: el terminal solo actualiza `lastSeenAt` estando activo; no cambia su estado.
  Revocar es final (`terminalStatusMachine`, replicada en `validTerminalTransition`).
- Un terminal activo lee el negocio y los miembros; nada más (no ventas, caja ni catálogo).
- `terminalSessions`: cada trabajador crea solo la suya, en un terminal activo; la cierra una vez.
  El admin puede expirar sesiones abiertas. Nadie la reabre ni cambia su trabajador o terminal.
- **Ventas:** un empleado solo vende con `terminalId` de un terminal **activo**. El admin puede
  vender también desde su propio equipo (`terminalId: null`).
- Los intentos fallidos se bloquean en el terminal (mismo esquema exponencial del PIN: 5 libres,
  30 s → 15 min) y además Firebase Auth limita los intentos por cuenta (`too-many-requests`).

## Limitaciones (sin backend) y recomendación

> **La mejor opción es Cloud Functions.** Con 3–4 funciones _callable_ (vincular, login con PIN,
> login con QR, cerrar sesión) se cumplen todos los requisitos con seguridad real. Corren gratis en
> el emulador; en producción requieren el plan Blaze (con capa gratuita: para un prototipo el
> costo esperado es 0).

| Requisito                           | Sin backend (hoy)                                                                                                                                                                | Con Cloud Functions                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Login con **PIN**                   | ❌ No implementado. Un PIN de 4–6 dígitos verificado en el cliente se rompe por fuerza bruta.                                                                                    | La función verifica el hash (PBKDF2) con límite de intentos y devuelve un _custom token_ del trabajador.                      |
| Login con **QR personal**           | ❌ No implementado. Sin servidor, el token del QR tendría que ser la contraseña.                                                                                                 | El QR lleva un token opaco; la función compara su hash con `qrTokenHash` y emite un _custom token_. Revocar = borrar el hash. |
| Ventas "desde un terminal"          | 🟡 El `terminalId` lo declara el cliente; las reglas validan que exista y esté activo, pero un empleado que conozca el id de un terminal activo podría usarlo desde otro equipo. | El _custom token_ incluye el claim `terminalId`; las reglas lo leen del token, no del documento.                              |
| Una sola sesión activa por terminal | 🟡 El cliente cierra la anterior antes de abrir otra; las reglas no lo impiden.                                                                                                  | La función cierra la anterior en una transacción.                                                                             |
| Cerrar sesión sin conexión          | 🟡 Si no hay red, la sesión queda `active`; el admin puede expirarla.                                                                                                            | Igual (es offline), pero una función programada puede expirar sesiones viejas.                                                |

## Pendiente

- Cloud Functions para PIN, QR personal (generar/regenerar/revocar) y el claim `terminalId`.
- Ventas y movimientos de caja **por trabajador** en reportes (los datos ya existen: `createdBy`,
  `terminalId`, `terminalSessions`).
