# CLAUDE.md — SuperPOS

POS **offline-first** para pequeños negocios (tienda, cafetería, restaurante) como PWA estática:
React 19 + TypeScript estricto + Firebase (Auth, Firestore, Storage, Hosting, App Check), sin
backend propio. Multi-negocio, roles por permisos, módulos activables. Docs: [docs/README.md](docs/README.md).

## Comandos

```bash
pnpm install                 # Node 24 (.nvmrc), pnpm 11
cp .env.example .env.local   # demo-superpos + emuladores
pnpm emulators               # Auth 9099 · Firestore 8080 · Storage 9199 · UI 4000 (Java 21+)
pnpm seed                    # 2 negocios + 6 usuarios (superpos123; soporte@ = super admin), SOLO emulador
pnpm dev                     # http://localhost:5173  (/dev/ui = catálogo del sistema de diseño)
pnpm typecheck               # tsc app + node
pnpm lint                    # ESLint estricto, --max-warnings 0
pnpm format                  # Prettier (format:check en CI)
pnpm test                    # Vitest (dominio, componentes, hooks)
pnpm test:rules              # Security Rules (levanta el emulador; detén `pnpm emulators` antes)
pnpm test:e2e                # Playwright sobre build + emuladores sembrados
pnpm build && pnpm preview   # producción con Service Worker (puerto 4173)
pnpm check                   # todo lo anterior: debe quedar en verde
```

Iterar e2e con emuladores ya corriendo: `pnpm seed && pnpm exec playwright test`.

## Mapa de arquitectura

```text
ui / pages ──▶ application (hooks) ──▶ domain (puro)
                    │
                    ▼
             infrastructure (Firestore, outbox, platform) ──▶ domain
```

- `src/app/` — arranque, providers, router (rutas `lazy`), guardas, layout raíz, `/dev/ui`.
- `src/shared/domain` — `Money`, `AppError`, `Result`, `defineStateMachine`, fechas, pagos, sync, `Subscribe`.
- `src/shared/ui` — sistema de diseño (tokens → atoms → molecules → organisms → templates).
- `src/shared/lib` — `cn`, formatters (`Intl`), i18n `t()`, logger, `sanitizeText`.
- `src/shared/hooks` — `useLiveQuery` (onSnapshot + TanStack Query), `useToast`, `useSyncSummary`, lector de códigos.
- `src/shared/infrastructure` — `firebase/` (init, env, converters, errores), `offline/` (outbox,
  `trackWrite`, `syncStore`, `idbStorage`), `platform/` (`PlatformAdapter`), `payments/`.
- `src/features/<x>/{domain,application,infrastructure,ui,pages}` + `index.ts` (API pública,
  incluye `xPages` con `import()` diferido) + `README.md`.

Dependencias (las impone ESLint con `import-x/no-restricted-paths`):

- `domain` solo importa `domain`; nada de React ni Firebase.
- `ui`/`pages` no importan `infrastructure` (usan `application`).
- Otra feature y `app/` solo por `features/<y>/index.ts`. `shared` no importa `features` ni `app`.

### ¿Dónde pongo…?

| Qué                                         | Dónde                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Tipo, esquema Zod, cálculo puro             | `features/<x>/domain/*.ts` + `*.test.ts`                                                  |
| Lectura/escritura Firestore                 | `features/<x>/infrastructure/*Repository.ts`                                              |
| Hook de datos para la UI                    | `features/<x>/application/`                                                               |
| Componente reutilizado en 2+ features       | `shared/ui/<nivel>/`                                                                      |
| Texto de UI                                 | `shared/lib/i18n/messages/<ns>.ts` (+ registrar en `messages/index.ts`)                   |
| Color/tamaño/sombra                         | `shared/ui/tokens/tokens.css` + `@theme` en `app/styles/global.css`                       |
| Ruta nueva                                  | página + `xPages` en el index + `app/router.tsx` + `app/layout/navigation.tsx`            |
| Colección nueva                             | esquema + `firestore.rules` + `tests/rules/*.test.ts` + `docs/architecture/data-model.md` |
| Acción del super admin (todos los negocios) | `features/platform` + claim `platformAdmin` (ADR 0010)                                    |
| Capacidad nativa (impresora, cajón)         | `PlatformAdapter` (implementación web por defecto)                                        |
| Operación que Firestore no encola           | handler del outbox registrado desde `app/`                                                |

Receta completa: [docs/guides/adding-a-feature.md](docs/guides/adding-a-feature.md).

## Convenciones de código

- TypeScript `strict` + `noUncheckedIndexedAccess`. **Sin `any`.** `as` solo en: converters,
  constructores de tipos _branded_ (`money()`), `Object.keys` tipado y pruebas.
- Nombres en inglés en el código; **textos de UI en español vía `t('clave')`** (claves tipadas).
- Un componente por archivo, **≤ 250 líneas** (regla `max-lines`). Variantes con `cva`, no copias.
- **Dinero** siempre `Money` en enteros de la unidad mínima (campos `*Minor`); tasas en bps;
  formateo solo en la UI (`formatMoney`). Ver ADR 0005.
- **Fechas**: `Date` en dominio, `Timestamp` en Firestore, zona del negocio solo para mostrar.
- **Errores**: `AppError` con `code`; mapear Firebase con `mapFirebaseError`. Nunca decidir por el mensaje.
- **Estados**: transiciones con `defineStateMachine` (`canTransition`/`assertTransition`).
- Formularios: React Hook Form + `zodResolver(esquemaInput)`; `FormField` para label/ayuda/error.
  Usar `useWatch`, no `form.watch` (compatibilidad con React Compiler).
- Errores de TanStack Query ya tipados como `AppError` (`shared/types/react-query.d.ts`).
- **Prohibido**: importar `firebase/*` fuera de `infrastructure/`; APIs de Node, `window.require` o
  Electron en `src/`; `dangerouslySetInnerHTML`.

## Comentarios

- JSDoc en APIs públicas de `domain/` y `shared/ui` (props documentadas).
- Comentarios que explican el **porqué** (restricciones, decisiones), no el qué.
- Nada de código comentado ni TODO sin issue/ADR asociado.

## Seguridad (no negociable)

- **Las Security Rules son la única barrera.** `usePermission`, `<Can>` y guardas son solo UX.
- Denegación por defecto. **Toda colección nueva exige reglas y su prueba** (miembro con permiso /
  no miembro / empleado sin permiso). La tabla de permisos de las reglas debe coincidir con
  `ROLE_PERMISSIONS` (lo verifica `permissions.test.ts`).
- Cero secretos en el repo: solo `VITE_*` en `.env.local`. La config web de Firebase no es secreta.
- `scripts/seed.ts` solo apunta al emulador y a proyectos `demo-*`.

Lecciones de SmartTable (detalle en [security.md](docs/architecture/security.md)):

| #   | Regla                                                                 |
| --- | --------------------------------------------------------------------- |
| L1  | Venta y descuento de stock en el **mismo `writeBatch`** (`increment`) |
| L2  | Firebase Auth; PIN solo local con PBKDF2 + sal + bloqueo (ADR 0008)   |
| L3  | Nada sin autenticación                                                |
| L4  | Sin secretos en código                                                |
| L5  | Sin servidor propio expuesto                                          |
| L6  | Precio del catálogo; ventas inmutables (anular = documento `void`)    |
| L7  | `calculateTotals` puro, sin ítems anulados                            |
| L8  | Máquinas de estado explícitas                                         |
| L9  | Errores por `code`                                                    |
| L10 | Dinero en enteros                                                     |
| L11 | Timestamp/ISO UTC                                                     |
| L12 | Zod como esquema único; reglas probadas en emulador                   |
| L13 | Sin datos reales en el repo ni en el build                            |
| L14 | Lint estricto, archivos pequeños, sin código muerto                   |
| L15 | Escuchas filtradas por `businessId` bajo `businesses/{bid}`           |

## Reglas offline

- **Nada de `runTransaction`** en flujos que deban funcionar sin red: `writeBatch` + `increment()`.
- IDs generados en cliente (`doc(collection(...)).id`).
- **No hacer `await` de escrituras en la UI**: `trackWrite(promise, 'contexto')` y feedback inmediato
  ("guardado en este dispositivo"). Excepción explícita: crear negocio, aceptar invitación, login.
- Lo que Firestore no encola (Storage, pagos, Functions) va por el **outbox**, con handlers idempotentes.
- Lecturas en tiempo real con `useLiveQuery` + `watchQuery`/`watchDoc` (marcan `pendingSync`).
- Probar con la red desactivada (build + preview, DevTools offline o `pnpm test:e2e`).
- Estrategia por entidad y límites: [offline-sync.md](docs/architecture/offline-sync.md), ADR 0003.

## Atomic design

- Átomo → molécula → organismo → template → página (`features/*/pages`).
- Dependencias **solo hacia abajo**; un átomo no importa otro átomo; un organismo no importa otro
  organismo (lo recibe como slot). Lo impone ESLint por componente.
- Átomos/moléculas presentacionales y controlados por props; organismos reciben datos ya
  resueltos; nadie en `shared/ui` accede a datos.
- Componente usado en 2 features → se promueve a `shared/ui`, con prueba, JSDoc, export en
  `shared/ui/index.ts`, muestra en `/dev/ui` y fila en [components.md](docs/design-system/components.md).
- Solo tokens (`bg-surface`, `text-text-muted`…); objetivos táctiles ≥ 44 px (`min-h-touch`).

## Definición de terminado

- [ ] `pnpm check` en verde (typecheck, lint, formato, tests, reglas, build, e2e).
- [ ] Pruebas nuevas: dominio, componente y reglas según corresponda.
- [ ] Estados de UI completos: carga, vacío, error (con reintento) y sin conexión.
- [ ] Accesibilidad: roles/nombres accesibles, teclado, foco visible, contraste con tokens.
- [ ] Textos por i18n; dinero y fechas con los formatters.
- [ ] `docs/` actualizado en el mismo cambio (feature, data model, ADR si hubo decisión).
- [ ] Sin TODO huérfanos ni código sin uso.

## Flujo de trabajo para agentes

1. Leer `src/features/<x>/README.md`, `docs/features/<x>.md` y los ADR relacionados antes de tocar.
2. Cambios pequeños y verificables; correr `pnpm typecheck && pnpm lint && pnpm test` a menudo.
3. Cambios en datos: esquema Zod → reglas → pruebas de reglas → repositorio → UI.
4. Actualizar `docs/` en el mismo cambio; registrar decisiones nuevas como ADR
   ([plantilla](docs/adr/0000-template.md)); ADR `proposed` hasta que el equipo apruebe.
5. Antes de un `pnpm check` completo, detener `pnpm emulators` (los scripts levantan los suyos).

## Cosas que NO hacer

- No usar transacciones en flujos offline ni esperar escrituras en la UI.
- No importar Firebase fuera de `infrastructure/` ni archivos internos de otra feature.
- No guardar dinero como decimal ni fechas como texto local.
- No confiar en la UI para autorizar; no agregar colecciones sin reglas y pruebas.
- No editar ventas: anular con un documento nuevo.
- No commitear `.env*` (salvo `.env.example`), datos de emulador ni credenciales.
- No apuntar el seed o los tests a un proyecto real.
- No introducir colores sueltos, `dangerouslySetInnerHTML` ni APIs de Node/Electron en `src/`.
- No subir de versión TypeScript 7 / ESLint 10 sin un ADR (ver ADR 0001).
