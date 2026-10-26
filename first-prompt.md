# Prompt 1 — Estructura base, pantallas y componentes básicos

> Prompt para un agente de programación. Copia todo el contenido desde la siguiente línea horizontal y pégalo como instrucción inicial en un **repositorio nuevo y vacío**.

---

## Rol y objetivo

Actúa como ingeniero frontend senior especializado en React, TypeScript, PWA *offline-first* y Firebase.

Vas a crear la **estructura base** de un prototipo de POS (punto de venta) para pequeños negocios: tiendas, minimercados, cafeterías y restaurantes pequeños. En esta fase:

- **Sí** construyes: arquitectura de carpetas, configuración, sistema de diseño, componentes base, layout, navegación, pantallas con datos de ejemplo, autenticación y roles, y la infraestructura offline.
- **No** implementas la lógica de negocio completa (ventas reales, cierre de caja, inventario, pagos). Esas funcionalidades se harán después, una por una, con otro prompt. Deja preparados los puntos de extensión.

Trabaja por fases (sección 12). Al final de cada fase, verifica que el proyecto compila, pasa lint y pasa las pruebas antes de seguir.

## 1. Contexto: de dónde viene este proyecto

Este proyecto reemplaza a una app anterior ("SmartTable"): POS solo para restaurantes, con Express + SQLite + Electron. **No copies su código.** Usa estas lecciones aprendidas, que son requisitos:

| # | Problema en la app anterior | Requisito en la nueva app |
|---|---|---|
| L1 | El inventario nunca se descontaba al vender | El modelo de datos y los servicios de venta deben prever el descuento de stock en la **misma escritura atómica** que la venta (se implementa en la fase de funcionalidades; aquí solo el diseño y las interfaces). |
| L2 | PIN de 4 dígitos con SHA-256 sin sal, aceptado en texto plano, sin límite de intentos | Login principal con **Firebase Authentication** (email + contraseña). Si hay PIN de cambio rápido de empleado, se deriva con **PBKDF2 (WebCrypto) + sal por usuario**, nunca se guarda en claro y tiene bloqueo tras intentos fallidos. |
| L3 | Lista de usuarios y creación de usuarios accesibles sin autenticación | Ninguna lectura ni escritura sin autenticación. Las reglas de Firestore niegan todo por defecto. |
| L4 | Secreto JWT fijo en el código como valor por defecto | Cero secretos en el código. Toda la configuración por variables `VITE_*`. La config web de Firebase no es secreta: la seguridad depende de las **Security Rules** y de **App Check**. |
| L5 | Túnel público a Internet activado por defecto | No hay servidor propio que exponer. Hosting estático (Firebase Hosting) con HTTPS. |
| L6 | El cliente podía fijar el precio de los ítems | Los precios se toman del catálogo. Las reglas de Firestore validan que el precio de cada línea coincida con el del producto (cuando sea viable) y las ventas no se pueden editar después de creadas. |
| L7 | El total sumaba ítems cancelados | Funciones de cálculo **puras y probadas** (`calculateTotals`) que excluyen ítems anulados. |
| L8 | Estados de pedido sin control de transiciones | Máquinas de estado explícitas (`canTransition(from, to)`) para venta, caja y pedido. |
| L9 | Códigos HTTP decididos por el texto del error | Errores tipados (`AppError` con `code`), nunca por comparación de mensajes. |
| L10 | Dinero como coma flotante (`REAL`) | Dinero siempre en **enteros de la unidad mínima** (centavos) con un tipo `Money`. Formateo solo en la UI. |
| L11 | Fechas en texto con hora local | `Timestamp` de Firestore / ISO 8601 UTC. Zona horaria del negocio solo para mostrar. |
| L12 | Esquema de pruebas duplicado y desincronizado | Un único esquema: tipos TypeScript + validación con **Zod**. Pruebas contra el **Firebase Emulator Suite**. |
| L13 | Datos reales empaquetados por accidente en el instalador | `.gitignore` y build sin datos locales; los *seeds* solo apuntan al emulador. |
| L14 | Código muerto, archivos de más de 700 líneas, 55 errores de lint | Lint estricto en CI, límite orientativo de 250 líneas por componente y nada de código sin uso. |
| L15 | El hub de tiempo real enviaba eventos de todos a todos | Escuchas de Firestore filtradas por `businessId` y protegidas por reglas. |

## 2. Restricciones del prototipo

- **Un solo repositorio, sin backend propio.** Firebase es el *backend-as-a-service*: Auth, Firestore, Storage, Hosting y App Check.
- **Firebase Cloud Functions no se usa en esta fase**, pero la arquitectura debe permitir añadirlo después (carpeta `functions/` reservada y documentada) para pagos y operaciones privilegiadas.
- **Node.js** solo para herramientas: scripts, seeds del emulador y tests. Ningún código de la app puede depender de APIs de Node.
- **Compatibilidad futura con Tauri** para la versión de escritorio: la app es 100 % web estática. No uses `window.require`, ni rutas absolutas del sistema, ni nada específico de Electron. Toda capacidad nativa futura (impresora térmica, cajón de dinero) va detrás de una interfaz `PlatformAdapter` con implementación web por defecto.
- **Multi-negocio y multi-tipo de negocio:** cada dato pertenece a un `businessId`. Las funcionalidades por vertical (por ejemplo, mesas de restaurante) son **módulos activables** por negocio.

## 3. Stack técnico

| Área | Elección | Notas |
|---|---|---|
| Lenguaje | TypeScript `strict` | `noUncheckedIndexedAccess: true`, sin `any`. |
| Framework | React 19 + Vite | |
| Enrutamiento | React Router | Rutas con carga diferida por módulo. |
| Estado del servidor | TanStack Query | Además, `onSnapshot` de Firestore para tiempo real. |
| Estado de UI | Zustand | Solo estado de UI local: carrito, modales, preferencias. |
| Formularios | React Hook Form + Zod | Los esquemas Zod son la fuente única de validación. |
| Estilos | Tailwind CSS v4 + tokens CSS | Componentes accesibles con Radix UI primitives. |
| Iconos | lucide-react | |
| PWA | `vite-plugin-pwa` (Workbox) | `registerType: 'prompt'`, con aviso de "nueva versión disponible". |
| Datos | Firebase JS SDK modular v11+ | Firestore con `persistentLocalCache` + `persistentMultipleTabManager`. |
| i18n | Español de Colombia por defecto, preparado para i18n | `Intl.NumberFormat` y `Intl.DateTimeFormat`. |
| Pruebas | Vitest + Testing Library; Playwright para e2e | `@firebase/rules-unit-testing` para las reglas. |
| Calidad | ESLint (flat config, `typescript-eslint` strict, `react-hooks`, `jsx-a11y`) + Prettier | Husky + lint-staged. |
| Gestor de paquetes | pnpm | Versión de Node fijada en `.nvmrc` y en `engines`. |

Si alguna versión o librería no está disponible o tiene una alternativa claramente mejor, propón el cambio en un ADR (sección 9) antes de aplicarlo.

## 4. Arquitectura

### 4.1 Capas

Arquitectura **por *features*** con capas internas. Las dependencias solo apuntan hacia adentro.

```text
ui (pages, components) ──▶ application (hooks, casos de uso) ──▶ domain (tipos, reglas puras)
                                     │
                                     ▼
                            infrastructure (repositorios Firebase, outbox, platform)
```

- **`domain/`**: TypeScript puro, sin React ni Firebase. Entidades, esquemas Zod, `Money`, máquinas de estado, cálculos. Cobertura de pruebas del 100 % como objetivo.
- **`application/`**: casos de uso y hooks que orquestan el dominio y los repositorios mediante **interfaces** (puertos).
- **`infrastructure/`**: implementaciones de los puertos: `FirestoreProductRepository`, `PaymentProvider` y otros. Es la única capa que importa `firebase/*`.
- **`ui/`**: componentes y páginas.

Haz cumplir estos límites con la regla ESLint `import/no-restricted-paths` (o `eslint-plugin-boundaries`).

### 4.2 Estructura de carpetas

```text
/
├── CLAUDE.md
├── README.md
├── docs/                       # Documentación (sección 8)
├── functions/                  # Reservado para Cloud Functions; solo README en esta fase
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .env.example
├── scripts/                    # Node: seed del emulador, utilidades
├── public/                     # Íconos PWA, manifest assets
├── tests/
│   ├── e2e/                    # Playwright
│   └── rules/                  # Pruebas de Security Rules
└── src/
    ├── app/                    # Bootstrap: providers, router, layout raíz, guardas
    ├── shared/
    │   ├── domain/             # Money, AppError, Result, ids, fechas, state machine helper
    │   ├── ui/                 # Sistema de diseño (atomic design, sección 5)
    │   ├── lib/                # Utilidades sin dominio (formatters, logger)
    │   ├── hooks/              # useOnlineStatus, useMediaQuery, ...
    │   └── infrastructure/
    │       ├── firebase/       # init, emulator connect, converters
    │       ├── offline/        # outbox, sync status, persistence
    │       ├── platform/       # PlatformAdapter (web; futuro tauri)
    │       └── payments/       # PaymentProvider (puerto + implementación simulada)
    └── features/
        ├── auth/               # login, sesión, cambio rápido de empleado
        ├── business/           # negocio, configuración, módulos activos
        ├── users/              # empleados, roles, permisos
        ├── catalog/            # productos, categorías, variantes, códigos de barras
        ├── inventory/          # stock, movimientos, proveedores
        ├── sales/              # POS: carrito, cobro, tickets
        ├── cash/               # turnos de caja, apertura/cierre, gastos
        ├── customers/          # clientes (opcional por negocio)
        ├── reports/            # reportes
        ├── settings/           # ajustes generales, impuestos, medios de pago
        └── restaurant/         # módulo vertical: mesas, zonas, comandas (activable)
```

Cada carpeta de `features/<nombre>/` tiene esta estructura:

```text
features/<nombre>/
├── domain/          # tipos, esquemas zod, reglas puras + *.test.ts
├── application/     # hooks/casos de uso
├── infrastructure/  # repositorios Firestore
├── ui/              # componentes específicos de la feature
├── pages/           # pantallas enrutadas
├── index.ts         # API pública de la feature (lo único importable desde fuera)
└── README.md        # 10–30 líneas: propósito, entidades, permisos, estado
```

### 4.3 Multi-tenant y modelo de datos en Firestore

Todo cuelga del negocio:

```text
businesses/{businessId}
  ├── members/{uid}           # rol, permisos extra, estado, pinHash/salt (opcional)
  ├── products/{productId}
  ├── categories/{categoryId}
  ├── inventoryMovements/{id}
  ├── suppliers/{id}
  ├── customers/{id}
  ├── cashShifts/{shiftId}
  │     └── expenses/{id}
  ├── sales/{saleId}          # inmutable tras crearse; anulaciones como documento nuevo
  ├── settings/{doc}          # general, taxes, paymentMethods, modules
  └── restaurant/... (tables, zones, orders)  # solo si el módulo está activo
users/{uid}                   # perfil global + lista de businessIds
```

- IDs generados en cliente: `doc(collection(...)).id`. Así funcionan sin conexión.
- Todos los documentos llevan `createdAt`, `updatedAt`, `createdBy` y `schemaVersion`.
- Usa *converters* de Firestore tipados con Zod en lectura y escritura.
- Las ventas guardan un **snapshot** de nombre, precio e impuesto de cada línea, para que cambiar el catálogo no altere el historial.

### 4.4 Roles y permisos

- Roles base: **`admin`** y **`employee`**.
- Autorización **basada en permisos**, no en roles fijos en el código. Un mapa `ROLE_PERMISSIONS: Record<Role, Permission[]>` en `features/users/domain/permissions.ts`, con permisos como `sales.create`, `sales.void`, `cash.open`, `cash.close`, `catalog.manage`, `inventory.adjust`, `reports.view`, `users.manage`, `settings.manage`. El admin puede conceder permisos extra a un empleado (`members/{uid}.extraPermissions`).
- En la UI: hook `usePermission('catalog.manage')` y componente `<Can permission="...">`. Las guardas de ruta usan lo mismo.
- En el servidor: **las Security Rules son la única barrera real**. Implementa funciones `isMember(bid)`, `role(bid)`, `hasPermission(bid, p)` y prueba cada colección con `@firebase/rules-unit-testing`. Documenta que las comprobaciones de la UI son solo de experiencia de usuario.
- Mejora futura documentada en un ADR: *custom claims* asignados mediante Cloud Functions para no pagar lecturas `get()` en cada regla.

### 4.5 Offline y "guardado en memoria"

Requisito central: **la app debe poder vender sin conexión** y sincronizar sola al volver.

1. **Persistencia de Firestore:** `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`. Las lecturas salen de la caché local (IndexedDB) y las escrituras se encolan.
2. **Limitación conocida:** las **transacciones de Firestore no funcionan sin conexión**. Por eso:
   - Las operaciones de venta se diseñan como **`writeBatch`** con `increment()` para el stock. `increment` funciona offline y se fusiona en el servidor.
   - Las reglas de negocio que exigen consistencia fuerte (stock negativo, numeración consecutiva de facturas) se resuelven con una política documentada en un ADR. Opciones: permitir stock negativo con alerta, y numeración local por dispositivo (`<deviceCode>-<seq>`) o asignada después por Cloud Functions.
3. **Outbox propio (`shared/infrastructure/offline/outbox`)** para lo que Firestore no encola: subidas a Storage, futuros pagos y llamadas a Functions. Se implementa en IndexedDB (con `idb`), con reintentos y backoff exponencial, idempotencia mediante `operationId` y estado visible.
4. **Estado de sincronización visible:** indicador global (en línea / sin conexión / sincronizando N cambios / error), basado en `navigator.onLine`, `waitForPendingWrites` y `metadata.hasPendingWrites` de los snapshots. Cada venta muestra si está "pendiente de sincronizar".
5. **Service Worker (Workbox):** *precache* del *app shell*; `StaleWhileRevalidate` para fuentes e imágenes del catálogo; navegación con *fallback* a `index.html`. La app debe abrir sin red tras la primera carga.
6. **Borradores en memoria:** el carrito en curso y los formularios largos se guardan en IndexedDB (*persist middleware* de Zustand con almacenamiento `idb`) para sobrevivir a recargas y cierres.
7. **Sesión offline:** Firebase Auth persiste la sesión en IndexedDB. Si no hay red, se permite seguir con el último usuario autenticado. Un nuevo login requiere red; documenta este comportamiento.
8. **Conflictos:** documenta en `docs/architecture/offline-sync.md` la estrategia por entidad. Ventas: solo inserción, sin conflictos. Catálogo: gana la última escritura. Stock: incrementos conmutativos. Caja: un turno abierto por dispositivo o por negocio, a decidir en un ADR.

### 4.6 Pagos (no especificados todavía)

Diseña el **puerto**, no la integración:

- `PaymentProvider` en `shared/infrastructure/payments/` con métodos como `createPaymentIntent`, `confirm`, `refund` y `getStatus`, todos con `idempotencyKey`. Tipos `PaymentMethod` (cash, card, transfer, wallet, other) y `PaymentStatus` (pending, authorized, captured, failed, refunded) con su máquina de estados.
- Implementaciones: `CashPaymentProvider` (local, funciona sin conexión) y `MockCardPaymentProvider` (simulado).
- Una venta admite **varios pagos** (pago mixto y cambio/vuelto).
- ADR que documente: los pagos electrónicos reales **requieren servidor** (Cloud Functions + webhooks del proveedor, por ejemplo Wompi, Mercado Pago o Stripe). El cliente nunca guarda claves secretas. Los pagos electrónicos sin conexión no son posibles: se encolan como "pendientes", o se rechazan.

## 5. Diseño de interfaz (atomic design)

### 5.1 Principios
- **Minimalista, atractiva y fácil de usar:** mucho espacio en blanco, una acción principal por pantalla, máximo 2 niveles de navegación.
- **Pensada para tablet y móvil táctil primero**, y usable en escritorio. Objetivos táctiles de al menos 44×44 px.
- **Velocidad de caja:** vender un producto en 3 toques o menos. Atajos de teclado en escritorio y soporte de lector de código de barras (entrada de teclado rápida).
- **Accesibilidad WCAG 2.2 AA:** contraste, foco visible, navegación por teclado, `aria-*` correctos, respeto de `prefers-reduced-motion`.
- **Modo claro y oscuro** mediante tokens.
- Estados siempre diseñados: carga (*skeletons*), vacío (con llamada a la acción), error (con reintento) y sin conexión.

### 5.2 Tokens (`src/shared/ui/tokens/`)
Variables CSS para color (neutros + 1 color primario + semánticos success/warning/danger/info), tipografía (una familia sans, por ejemplo Inter, con escala de 6 tamaños), espaciado (escala de 4 px), radios, sombras (2–3 niveles), duraciones de animación y *z-index*. Tailwind consume estos tokens.

### 5.3 Niveles de componentes (`src/shared/ui/`)

| Nivel | Componentes mínimos |
|---|---|
| `atoms/` | Button, IconButton, Input, NumberInput, MoneyInput, Select, Checkbox, Switch, Badge, Avatar, Spinner, Skeleton, Text/Heading, Divider, Kbd |
| `molecules/` | FormField (label + input + error), SearchBar, QuantityStepper, StatCard, EmptyState, ConfirmDialog, Toast, SyncStatusBadge, PermissionGate (`<Can>`), Tabs, DropdownMenu |
| `organisms/` | AppSidebar, TopBar (negocio, usuario, estado de sincronización), DataTable (orden, búsqueda y paginación en cliente), ProductGrid, CartPanel, Numpad, PaymentSheet (solo UI), Modal/Drawer, PageHeader |
| `templates/` | AppShell (sidebar + topbar + contenido), AuthLayout, PosLayout (catálogo + carrito), SettingsLayout (subnavegación) |

**Reglas de atomic design (obligatorias):**
- **Dependencias solo hacia abajo:** un átomo no importa nada de `ui/`, salvo tokens; una molécula solo importa átomos; un organismo importa moléculas y átomos; un template compone organismos y define la distribución, sin datos. Las **páginas** (`features/*/pages/`) son el nivel 5 de atomic design: rellenan los templates con datos reales. Haz cumplir estas reglas con ESLint (`import/no-restricted-paths` o `eslint-plugin-boundaries`).
- **Átomos y moléculas no tienen lógica de negocio ni acceso a datos:** son presentacionales y controlados por *props*. Los organismos pueden recibir datos ya resueltos, pero no llaman a Firebase ni a los repositorios. Los hooks de datos viven en `application/` y se usan desde páginas o contenedores.
- **Componentes específicos de una feature** (`features/<x>/ui/`) siguen la misma jerarquía y se componen con los de `shared/ui`. Si un componente se reutiliza en dos features, se promueve a `shared/ui`.
- **Estructura por componente:** `ComponentName/ComponentName.tsx`, `ComponentName.test.tsx` e `index.ts`, con variantes mediante *props* (por ejemplo `variant` y `size` con `cva`/`tailwind-variants`) en lugar de componentes duplicados.
- **Criterio para clasificar** (documentarlo en `docs/design-system/atomic-design.md`):
  - átomo = no se puede dividir más sin perder su función;
  - molécula = grupo pequeño con una sola responsabilidad;
  - organismo = sección autónoma de la interfaz;
  - template = esqueleto de página.

Cada componente:
- tiene sus *props* tipadas y documentadas con JSDoc;
- tiene al menos una prueba de comportamiento;
- se exporta desde `shared/ui/index.ts`.

Añade una página interna `/dev/ui` (solo en desarrollo) que muestre todos los componentes y estados. Es un catálogo vivo en lugar de Storybook, para no añadir una dependencia; si prefieres Storybook, justifícalo en un ADR.

## 6. Pantallas de esta fase

Todas funcionales a nivel de navegación y UI, con datos del **emulador sembrado** (preferente) o *mocks* tipados. Cada pantalla tiene sus estados de carga, vacío, error y sin conexión.

| Ruta | Pantalla | Permiso | Alcance en esta fase |
|---|---|---|---|
| `/login` | Inicio de sesión | público | **Real** (Firebase Auth): login, logout, recuperación de contraseña. |
| `/onboarding` | Crear negocio | autenticado sin negocio | **Real**: nombre, tipo de negocio (tienda, cafetería, restaurante, otro), moneda, impuesto por defecto; crea el negocio y el miembro admin. |
| `/select-business` | Selector de negocio | autenticado | Si el usuario pertenece a varios negocios. |
| `/lock` | Cambio rápido de empleado | miembro | Solo UI + interfaz del servicio de PIN. |
| `/` | Inicio (dashboard) | `reports.view` o empleado | Tarjetas de métricas de ejemplo y accesos rápidos. |
| `/pos` | Punto de venta | `sales.create` | UI completa: búsqueda, categorías, grilla, carrito con cantidades, numpad, PaymentSheet de solo UI. Carrito persistido en IndexedDB. **Sin registrar ventas reales.** |
| `/sales` | Historial de ventas | `sales.view` | Lista y detalle (datos sembrados). |
| `/catalog` | Productos y categorías | `catalog.manage` | Lista + formulario crear/editar con validación Zod. Puede guardar en Firestore (CRUD simple) como prueba de la cadena completa. |
| `/inventory` | Inventario | `inventory.view` | Lista con nivel de stock y alertas de stock bajo (solo lectura). |
| `/cash` | Caja | `cash.open` | UI de estado del turno y modales de apertura y cierre (sin lógica). |
| `/customers` | Clientes | `customers.view` | Lista y formulario (UI). |
| `/reports` | Reportes | `reports.view` | Layout con filtros y gráficos de ejemplo. |
| `/settings/*` | Configuración | `settings.manage` | Negocio, módulos activos, impuestos, medios de pago, empleados (invitar, rol, permisos; UI + escritura en `members`). |
| `/restaurant/tables` | Mesas | módulo `restaurant` activo | Ruta registrada solo si el módulo está activo; pantalla de marcador. |
| `*` | 404 | — | |

## 7. Archivo `CLAUDE.md` (créalo en la raíz)

Debe ser conciso, de 150 a 270 líneas, y servir como memoria del proyecto para futuros agentes. Contenido obligatorio:

1. **Qué es el proyecto**, en 3 líneas, con enlace a `docs/README.md`.
2. **Comandos:** instalar, dev, emuladores, seed, test, test de reglas, e2e, lint, typecheck, build y preview.
3. **Mapa de arquitectura:** capas, regla de dependencias y dónde va cada cosa ("¿dónde pongo…?").
4. **Convenciones de código:**
   - TS estricto, sin `any`, sin `as` salvo en *converters*;
   - nombres en inglés en el código y textos de UI en español mediante el módulo i18n;
   - un componente por archivo, unas 250 líneas como máximo;
   - `Money` en enteros;
   - errores con `AppError`;
   - nada de importar `firebase/*` fuera de `infrastructure/`;
   - nada de APIs de Node ni de Electron en `src/`.
5. **Política de comentarios:** JSDoc en APIs públicas de `domain/` y `shared/ui`; comentarios que explican el *porqué*, no el *qué*; nada de código comentado.
6. **Reglas de seguridad no negociables:** lista L1–L15 resumida; toda colección nueva exige reglas y su prueba; sin secretos en el repo.
7. **Reglas offline:** sin transacciones en flujos que deben funcionar offline; usar `writeBatch` + `increment`; IDs de cliente; operaciones idempotentes; probar con la red desactivada.
8. **Atomic design:** niveles, dependencias solo hacia abajo, componentes presentacionales sin acceso a datos y cuándo promover un componente a `shared/ui`.
9. **Definición de terminado (DoD):** typecheck, lint, tests y reglas en verde; documentación actualizada; estados de UI completos; accesibilidad revisada; sin TODO huérfanos.
10. **Flujo de trabajo para agentes:** leer el README de la feature y el ADR relacionado antes de tocarla; cambios pequeños; actualizar `docs/` en el mismo cambio; registrar decisiones nuevas como ADR.
11. **Cosas que no hacer:** lista breve y explícita.

## 8. Documentación (`docs/`)

Documentación organizada por temas, clara y enlazada entre sí. Cada documento tiene una responsabilidad clara y evita duplicar a los demás. Cada uno empieza con *front-matter*:

```markdown
---
title: Estrategia offline y sincronización
status: draft | accepted | deprecated
owner: <equipo o persona>
updated: YYYY-MM-DD
related: [adr/0003-firestore-offline.md, features/sales.md]
---
```

Estructura mínima:

```text
docs/
├── README.md                    # índice + orden de lectura
├── product/
│   ├── vision.md                # visión, tipos de negocio, alcance del prototipo
│   ├── glossary.md              # términos (turno, venta, anulación, módulo...)
│   └── roles-and-permissions.md # matriz rol × permiso
├── architecture/
│   ├── overview.md              # capas + diagrama Mermaid
│   ├── folder-structure.md
│   ├── data-model.md            # colecciones Firestore + diagrama
│   ├── offline-sync.md          # estrategia por entidad, outbox, conflictos
│   ├── security.md              # reglas, App Check, amenazas, lecciones L1–L15
│   ├── payments.md              # puerto PaymentProvider y flujo futuro con servidor
│   └── platform-desktop.md      # PWA hoy, Tauri mañana (PlatformAdapter)
├── design-system/
│   ├── principles.md
│   ├── tokens.md
│   ├── atomic-design.md         # niveles, reglas de dependencia y criterios para clasificar
│   └── components.md            # inventario de componentes por nivel + reglas de uso
├── features/
│   └── <feature>.md             # una por feature: estado, entidades, permisos, pantallas
├── guides/
│   ├── getting-started.md
│   ├── testing.md
│   └── adding-a-feature.md      # receta paso a paso
└── adr/
    ├── 0000-template.md
    ├── 0001-stack.md
    ├── 0002-firebase-sin-backend-propio.md
    ├── 0003-firestore-offline-y-limites-de-transacciones.md
    ├── 0004-permisos-por-rules-vs-custom-claims.md
    ├── 0005-dinero-en-enteros.md
    ├── 0006-numeracion-de-ventas-offline.md   # estado: proposed
    └── 0007-pagos-requieren-servidor.md       # estado: proposed
```

Formato de ADR: Contexto → Decisión → Alternativas consideradas → Consecuencias → Estado.

## 9. Seguridad y configuración

- `.env.example` con `VITE_FIREBASE_*`, `VITE_USE_EMULATORS` y `VITE_APP_CHECK_SITE_KEY`. Nunca subas `.env`.
- Reglas iniciales de Firestore y Storage con **denegación por defecto** y reglas por colección. Valida en las reglas: pertenencia al negocio, permiso, campos permitidos (`keys().hasOnly`), tipos, `createdBy == request.auth.uid` e inmutabilidad de `sales`.
- App Check (reCAPTCHA Enterprise) preparado y desactivable en desarrollo.
- Content Security Policy y cabeceras de seguridad en `firebase.json` (hosting).
- Sin `dangerouslySetInnerHTML`. Sanitiza cualquier texto que llegue a impresión o exportación.
- `scripts/seed.ts` **solo** puede apuntar al emulador: debe abortar si detecta un proyecto real.

## 10. Calidad

- Scripts: `typecheck`, `lint`, `test`, `test:rules` (emulador), `test:e2e`, `build`, más `check`, que agrupa los anteriores.
- Pruebas mínimas en esta fase:
  - `Money` y `calculateTotals`;
  - máquinas de estado;
  - `usePermission` / `<Can>`;
  - guardas de ruta;
  - reglas de Firestore (miembro, no miembro y empleado sin permiso, por cada colección creada);
  - outbox (encolar, reintentar, idempotencia);
  - un e2e de login → POS → agregar al carrito → recargar → el carrito persiste;
  - un e2e offline (Playwright `context.setOffline(true)`) que abre la app y navega.
- Si el repositorio es Git, añade un workflow de CI (GitHub Actions) que ejecute `pnpm check` con los emuladores.

## 11. Entregables

1. Repositorio que arranca con `pnpm install && pnpm emulators & pnpm dev`, más seed de datos de ejemplo de 2 negocios (una tienda y una cafetería) con usuarios admin y employee.
2. App instalable como PWA, que abre offline después de la primera visita.
3. Todas las pantallas de la sección 6, navegables y protegidas por permisos.
4. Sistema de diseño completo en `/dev/ui`.
5. `CLAUDE.md`, `docs/` y ADRs iniciales.
6. `pnpm check` en verde.

## 12. Fases de trabajo

1. **Andamiaje:** Vite + TS + lint + tests + Tailwind + tokens + estructura de carpetas + `CLAUDE.md` inicial.
2. **Sistema de diseño:** átomos → moléculas → organismos → templates + `/dev/ui`.
3. **Firebase:** init, emuladores, converters, reglas por defecto, seed.
4. **Auth, negocio y permisos:** login, onboarding, `members`, `usePermission`, guardas y reglas con pruebas.
5. **Offline:** persistencia, Service Worker, outbox, indicador de sincronización y borradores persistidos.
6. **Pantallas** de la sección 6.
7. **Documentación** y ADRs; revisión final de `CLAUDE.md`.
8. **Verificación:** `pnpm check`, prueba manual offline y reporte final.

## 13. Reporte final

Al terminar, entrega:
- qué se creó, organizado por fase;
- comandos para ejecutar;
- resultados reales de `pnpm check`, sin afirmar nada que no se haya ejecutado;
- decisiones tomadas y ADRs abiertos;
- limitaciones conocidas, especialmente las de offline;
- la lista de features listas para implementar con el Prompt 2.
