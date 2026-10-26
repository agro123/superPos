---
title: Inventario de componentes
status: accepted
owner: diseño
updated: 2026-10-25
related: [atomic-design.md, tokens.md]
---

# Inventario de componentes

Catálogo vivo en **`/dev/ui`** (solo en desarrollo, `pnpm dev`). Todos se importan desde `@/shared/ui`.

## Átomos (17)

| Componente               | Uso                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `Button`                 | `variant` primary/secondary/outline/ghost/danger, `size` sm/md/lg, `loading`, `asChild` (enlaces) |
| `IconButton`             | Botón de 44 px solo ícono; `label` obligatorio                                                    |
| `Input`                  | Texto; `invalid` → `aria-invalid`                                                                 |
| `NumberInput`            | Número con coma decimal opcional; `min`/`max` al salir                                            |
| `MoneyInput`             | Pesos escritos ("12.500") → `Money` en centavos                                                   |
| `Select`                 | Radix Select con `options`                                                                        |
| `Checkbox`, `Switch`     | Radix; área táctil ampliada                                                                       |
| `Badge`                  | Estado corto con `tone`                                                                           |
| `Avatar`                 | Iniciales o imagen                                                                                |
| `Spinner`, `Skeleton`    | Carga indeterminada / con forma                                                                   |
| `Text`, `Heading`        | Escala tipográfica; `Heading` separa nivel semántico y tamaño                                     |
| `Divider`, `Kbd`, `Logo` | Separador, tecla, marca                                                                           |

## Moléculas (11)

`FormField` (label + control + ayuda + error con ARIA, _render prop_), `SearchBar` (Enter/Escape,
atajo), `QuantityStepper`, `StatCard`, `EmptyState` (vacío o error), `ConfirmDialog` (AlertDialog),
`Toast`/`Toaster` (la cola vive en `useToastStore`), `SyncStatusBadge`, `PermissionGate` (permiso
ya resuelto; `<Can>` lo conecta), `Tabs`, `DropdownMenu`.

## Organismos (10)

`AppSidebar`, `TopBar`, `DataTable` (búsqueda sin tildes, orden y paginación en cliente; la lógica
pura está en `dataTableModel.ts`), `ProductGrid`, `CartPanel`, `Numpad` (`applyNumpadKey` puro),
`PaymentSheet` (solo UI; recibe el teclado como slot), `Modal`, `Drawer` (left/right/bottom),
`PageHeader`.

## Templates (4)

`AppShell` (sidebar fija en escritorio, cajón en móvil, _skip link_), `AuthLayout`, `PosLayout`
(carrito lateral; hoja inferior en móvil), `SettingsLayout` (subnavegación).

## Reglas de uso

- Formularios: siempre `FormField` + esquema Zod con React Hook Form.
- Listas de datos: `DataTable` con `caption`, `emptyState` y estado `loading`.
- Acciones destructivas: `ConfirmDialog` con `tone="danger"`.
- Notificaciones: `useToast()`; los errores de sincronización los muestra `app/` automáticamente.
