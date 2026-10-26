---
title: ADR 0001 — Stack técnico
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [../architecture/overview.md, ../guides/getting-started.md]
---

# ADR 0001 — Stack técnico

## Contexto

El prototipo debe ser una PWA offline-first, 100 % web estática (compatible con Tauri a futuro), con
TypeScript estricto y Firebase como backend-as-a-service. El Prompt 1 propone un stack y pide
justificar cualquier desviación.

## Decisión

| Área            | Elección (versión fijada)                                                                     |
| --------------- | --------------------------------------------------------------------------------------------- |
| Lenguaje        | TypeScript **6.0.3** `strict` + `noUncheckedIndexedAccess`                                    |
| UI              | React 19.3 + Vite 8 (Rolldown) + React Router 8 (rutas con `lazy`)                            |
| Estado servidor | TanStack Query 5 + `onSnapshot` (helper `useLiveQuery`)                                       |
| Estado UI       | Zustand 5 (`persist` con IndexedDB para borradores)                                           |
| Formularios     | React Hook Form 7 + Zod 4 (`@hookform/resolvers` 6)                                           |
| Estilos         | Tailwind CSS 4 (`@theme` sobre tokens CSS) + `radix-ui` 1.8 (paquete unificado)               |
| PWA             | `vite-plugin-pwa` 2 (Workbox, `registerType: 'prompt'`)                                       |
| Datos           | Firebase JS SDK **13** (modular)                                                              |
| Pruebas         | Vitest 5 + Testing Library, Playwright 1.64, `@firebase/rules-unit-testing` 6                 |
| Calidad         | ESLint **9.39** (flat config) + typescript-eslint 8 strict + Prettier 3 + Husky + lint-staged |
| Herramientas    | pnpm 11, Node 24 (`.nvmrc`), `firebase-tools` como devDependency                              |

Desviaciones respecto a "la última versión":

- **TypeScript 6.0 y no 7.0**: `typescript-eslint` 8.72 solo admite `<6.1`. Sin lint tipado no hay
  límites de arquitectura ni reglas estrictas.
- **ESLint 9 y no 10**: `eslint-plugin-jsx-a11y` 6.10 solo admite hasta ESLint 9.
- **`import-x/no-restricted-paths`** (y no `eslint-plugin-boundaries`) para hacer cumplir capas y
  atomic design: API estable y conocida; las zonas se generan por feature y por componente.
- **Catálogo `/dev/ui` en vez de Storybook**: evita una dependencia pesada; se renderiza con los
  mismos providers y tokens que la app.
- **`firebase-tools` como devDependency**: versiones reproducibles de emuladores en local y CI.
- **pnpm `allowBuilds`**: solo `esbuild` y `unrs-resolver` ejecutan scripts de instalación.

## Alternativas consideradas

- **TS 7 sin typescript-eslint tipado** — se pierde `strictTypeChecked`; inaceptable (L14).
- **Storybook** — más potente para documentación aislada, pero añade cientos de dependencias.
- **Redux Toolkit** — innecesario: el estado de servidor vive en TanStack Query/Firestore.

## Consecuencias

- Al salir `typescript-eslint` compatible con TS 7 y `jsx-a11y` compatible con ESLint 10, actualizar
  y cerrar este punto en un ADR nuevo.
- El chunk de Firebase (~680 kB, ~200 kB gzip) se aísla y precachea (`vite.config.ts`).

## Estado

Aceptado.
