---
title: Primeros pasos
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [testing.md, ../architecture/overview.md]
---

# Primeros pasos

## Requisitos

- Node **24** (`.nvmrc`) y pnpm **11** (`corepack enable`).
- Java **21+** para el Firebase Emulator Suite (`firebase-tools` viene como devDependency).

## Arranque local

```bash
pnpm install
cp .env.example .env.local      # proyecto demo-superpos + emuladores
pnpm emulators                  # terminal 1: Auth 9099, Firestore 8080, Storage 9199, UI 4000
pnpm seed                       # terminal 2: 2 negocios de ejemplo
pnpm dev                        # http://localhost:5173
```

Usuarios del seed (contraseña `superpos123`, **solo existen en el emulador**):

| Email                    | Acceso                                                                            |
| ------------------------ | --------------------------------------------------------------------------------- |
| `rosa@superpos.test`     | Admin de _Minimercado Doña Rosa_                                                  |
| `carlos@superpos.test`   | Empleado del minimercado                                                          |
| `ana@superpos.test`      | Admin de _Café La Esquina_ y empleada del minimercado (ve el selector de negocio) |
| `luis@superpos.test`     | Empleado de la cafetería                                                          |
| `invitado@superpos.test` | Sin negocio; tiene una invitación pendiente al minimercado                        |

## Comandos

| Comando                                        | Qué hace                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm preview`     | Desarrollo, build de producción, servir el build (4173)             |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | Tipos, ESLint estricto, Prettier                                    |
| `pnpm test` / `pnpm test:coverage`             | Unitarias y de componentes (Vitest)                                 |
| `pnpm test:rules`                              | Security Rules contra el emulador (lo levanta solo)                 |
| `pnpm test:e2e`                                | Playwright contra el build + emuladores sembrados (lo levanta solo) |
| `pnpm check`                                   | Todo lo anterior en secuencia (lo que corre la CI)                  |

> `test:rules` y `test:e2e` usan `firebase emulators:exec`: detén `pnpm emulators` antes de
> ejecutarlos o habrá conflicto de puertos. Playwright necesita `pnpm exec playwright install chromium` una vez.

## Probar sin conexión

1. `pnpm build && pnpm preview` (el Service Worker no se registra en `pnpm dev`).
2. Entra, navega por POS y Ventas, y en DevTools → Network marca **Offline**.
3. Recarga: la app abre, el indicador muestra "Sin conexión" y el POS sigue funcionando.

## Producción

Crea un proyecto Firebase real, copia su config web a `.env.local` con `VITE_USE_EMULATORS=false`,
configura App Check (`VITE_APP_CHECK_SITE_KEY`) y despliega con
`firebase deploy --only hosting,firestore,storage`.

## Proyecto real de Firebase (`superpos-univalle`)

Alias `prod` en `.firebaserc`; Firestore en `southamerica-east1`, plan Spark (sin Storage: las
imágenes de productos requieren el plan Blaze).

1. Crea `.env.firebase.local` con la config web (`firebase apps:sdkconfig WEB --project prod`) y
   `VITE_USE_EMULATORS=false`. No se commitea.
2. Habilita **Authentication → Email/contraseña** en la consola (una sola vez).
3. `pnpm dev:firebase` (desarrollo contra el proyecto real) · `pnpm build:firebase`.
4. Reglas e índices: `firebase deploy --only firestore --project prod`.
   Publicar: `pnpm deploy:firebase` (hosting + Firestore).

`pnpm seed` y las pruebas siguen apuntando solo a los emuladores.

## Despliegue continuo (CD) y datos de demostración

- **Producción:** https://superpos-univalle.web.app
- `.github/workflows/deploy.yml` despliega Hosting y las reglas/índices de Firestore cuando el CI de
  `main` termina en verde, o a mano (Actions → CD → Run workflow). Usa el entorno `production`.
- **Datos de demostración** (`pnpm demo`, `scripts/demo.ts`): los 2 negocios ficticios del seed en el
  proyecto real, con una contraseña propia (`DEMO_PASSWORD`, nunca la del repositorio). Exige
  `DEMO_PROJECT_ID`, `DEMO_CONFIRM=<mismo proyecto>` y una cuenta de servicio
  (`GOOGLE_APPLICATION_CREDENTIALS`). Desde Actions: ejecutar CD a mano marcando "load_demo".
  No crea super administradores. `pnpm seed` sigue apuntando solo a los emuladores.

| En GitHub (Settings → Environments → `production`)                                                                                                | Tipo                   | Valor                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT`                                                                                                                        | Secreto                | JSON de la cuenta de servicio                                     |
| `DEMO_PASSWORD`                                                                                                                                   | Secreto                | Contraseña de los usuarios de demostración (10+ caracteres)       |
| `VITE_GEMINI_API_KEY`                                                                                                                             | Secreto (opcional)     | Clave de Gemini restringida por dominio; vacía = I.A. desactivada |
| `FIREBASE_PROJECT_ID`                                                                                                                             | Variable               | `superpos-univalle`                                               |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Variables              | Config web (`firebase apps:sdkconfig WEB --project prod`)         |
| `VITE_GEMINI_MODEL`, `VITE_APP_CHECK_SITE_KEY`                                                                                                    | Variables (opcionales) | Modelo de Gemini; clave de App Check                              |
