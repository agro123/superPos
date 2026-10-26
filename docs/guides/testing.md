---
title: Pruebas
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [getting-started.md, ../architecture/security.md]
---

# Pruebas

| Tipo                 | Herramienta                               | Ubicación                                  | Comando           |
| -------------------- | ----------------------------------------- | ------------------------------------------ | ----------------- |
| Dominio y utilidades | Vitest                                    | `src/**/domain/*.test.ts`, `src/shared/**` | `pnpm test`       |
| Componentes y hooks  | Vitest + Testing Library (jsdom)          | `*.test.tsx` junto al componente           | `pnpm test`       |
| Security Rules       | `@firebase/rules-unit-testing` + emulador | `tests/rules/`                             | `pnpm test:rules` |
| End-to-end           | Playwright (Chromium)                     | `tests/e2e/`                               | `pnpm test:e2e`   |

## Qué se prueba como mínimo

- `Money`, `calculateTotals`, máquinas de estado, permisos (y su sincronía con `firestore.rules`).
- `usePermission`, `<Can>`, lógica de guardas (`app/guards/access.ts`).
- Outbox: encolar, reintentar con backoff, idempotencia, ejecución no concurrente.
- Reglas: por cada colección, miembro con permiso / no miembro / empleado sin permiso.
- E2E: login → POS → agregar → recargar → el carrito persiste; abrir y navegar sin conexión.

## Convenciones

- Consultar por rol y nombre accesible (`getByRole('button', { name: 'Cobrar…' })`), nunca por clases.
- `fake-indexeddb` está activo en todas las pruebas (`src/test/setup.ts`); WebCrypto requiere
  `// @vitest-environment node`.
- Cobertura objetivo del dominio: 100 % (umbral en `vitest.config.ts`: 95 % líneas).

## Pruebas de reglas

Cada archivo arranca un entorno con `createEnv()` y siembra con reglas desactivadas (`seed()` en
`tests/rules/env.ts`). Para verificar que las pruebas detectan agujeros, haz una **prueba de
mutación**: abre temporalmente una regla (p. ej. `allow read: if true` en `businesses`) y confirma que
`pnpm test:rules` falla.

## E2E

`playwright.config.ts` construye la app con variables de emulador y la sirve con `vite preview` (el
Service Worker real). El script `test:e2e` levanta los emuladores, siembra y ejecuta. Para iterar con
emuladores ya corriendo: `pnpm seed && pnpm exec playwright test`.
