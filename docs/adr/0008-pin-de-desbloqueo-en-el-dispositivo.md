---
title: ADR 0008 — PIN de desbloqueo guardado solo en el dispositivo
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/security.md, ../features/auth.md]
---

# ADR 0008 — PIN de desbloqueo guardado solo en el dispositivo

## Contexto

SmartTable usaba un PIN de 4 dígitos con SHA-256 sin sal, aceptado en texto plano y sin límite de
intentos (L2). El Prompt 1 sugiere `members/{uid}.pinHash/salt`. Pero los miembros de un negocio
pueden leer todos los documentos `members`: un hash de un PIN de 4–6 dígitos se rompe por fuerza
bruta fuera de línea aunque use PBKDF2.

## Decisión

- El login principal es **Firebase Auth (email + contraseña)**. El PIN es solo una comodidad para
  **bloquear y desbloquear la pantalla** de una sesión ya abierta.
- El PIN se deriva con **PBKDF2-SHA256 (WebCrypto), 310 000 iteraciones y sal aleatoria de 16 bytes
  por usuario**, y se guarda **solo en IndexedDB del dispositivo** (`devicePinStore`). Nunca en claro
  ni en Firestore.
- Política: 4–6 dígitos, sin PINs triviales. Bloqueo exponencial tras 5 fallos (30 s → 15 min).
- "Cambiar de empleado" cierra la sesión; el otro empleado entra con su cuenta.

## Alternativas consideradas

- **Hash en `members`** (propuesta del prompt) — legible por otros miembros; descartado.
- **Cambio rápido real con custom tokens** — una Cloud Function verifica el PIN y emite un token de
  Firebase para otro usuario. Es la mejora futura cuando exista `functions/`.

## Consecuencias

- El PIN no viaja entre dispositivos: cada empleado lo crea en cada caja.
- El bloqueo protege la UI, no los datos en caché de IndexedDB (ver security.md).

## Estado

Aceptado.
