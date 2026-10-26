---
title: Estructura de carpetas
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [overview.md, ../guides/adding-a-feature.md]
---

# Estructura de carpetas

```text
/
├── CLAUDE.md, README.md
├── docs/                    # esta documentación
├── functions/               # reservado para Cloud Functions (solo README)
├── firebase.json            # emuladores, hosting, cabeceras de seguridad
├── firestore.rules, firestore.indexes.json, storage.rules
├── scripts/                 # Node: seed del emulador (seed.ts, seedData.ts, seedGuard.ts)
├── public/                  # íconos PWA
├── tests/
│   ├── rules/               # Security Rules (Vitest + emulador)
│   └── e2e/                 # Playwright (build de producción + emuladores)
└── src/
    ├── main.tsx             # arranque
    ├── app/                 # providers, router, guardas, layout raíz, /dev/ui, estilos
    ├── shared/
    │   ├── domain/          # Money, AppError, Result, state machine, fechas, pagos, sync
    │   ├── ui/              # sistema de diseño: tokens, atoms, molecules, organisms, templates
    │   ├── lib/             # cn, formatters, i18n, logger, sanitize, text
    │   ├── hooks/           # useLiveQuery, useToast, useSyncSummary, useBarcodeScanner…
    │   ├── types/           # augmentaciones de módulos (TanStack Query)
    │   └── infrastructure/
    │       ├── firebase/    # init, env, converters, errores, helpers de Firestore
    │       ├── offline/     # outbox, syncStore, trackWrite, idbStorage, runtime
    │       ├── platform/    # PlatformAdapter (web; futuro Tauri)
    │       └── payments/    # PaymentProvider + Cash + MockCard
    └── features/<nombre>/
        ├── domain/  application/  infrastructure/  ui/  pages/
        ├── index.ts         # API pública (incluye `xxxPages` con import() diferido)
        └── README.md
```

## "¿Dónde pongo…?"

| Quiero…                                            | Va en                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| Un tipo, esquema Zod o cálculo puro de una feature | `features/<x>/domain/` + `*.test.ts`                                        |
| Lectura/escritura de Firestore                     | `features/<x>/infrastructure/*Repository.ts`                                |
| Un hook que la UI usa para datos                   | `features/<x>/application/`                                                 |
| Un componente usado por 2+ features                | `shared/ui/<nivel>/`                                                        |
| Un texto de UI                                     | `shared/lib/i18n/messages/<namespace>.ts`                                   |
| Un color, tamaño o sombra                          | `shared/ui/tokens/tokens.css` (+ `@theme` en `app/styles/global.css`)       |
| Una ruta nueva                                     | página en la feature + `xxxPages` en su `index.ts` + `app/router.tsx`       |
| Una colección nueva                                | esquema en `domain`, reglas en `firestore.rules`, pruebas en `tests/rules/` |
| Una capacidad nativa (impresora)                   | método en `PlatformAdapter` + implementación web                            |
