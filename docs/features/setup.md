---
title: Feature: setup
status: draft
owner: equipo frontend
updated: 2026-11-07
related: [../adr/0014-configuracion-inicial-y-tour.md, business.md, settings.md]
---

# setup — configuración inicial guiada y tour

**Estado:** implementado.

| Pantalla                   | Ruta                     | Permiso                            |
| -------------------------- | ------------------------ | ---------------------------------- |
| Asistente de configuración | `/setup`                 | `settings.manage`                  |
| Tour guiado                | sobre cualquier pantalla | cualquier miembro (según permisos) |

## Asistente

- Un negocio nuevo (creado por el dueño o por la plataforma) nace con `settings/setup` pendiente.
  `useSetupRedirect` (en `RootLayout`) lleva al asistente a quien tiene `settings.manage`; los
  negocios anteriores (sin documento) no se redirigen.
- **10 pasos** (`SETUP_STEPS`): negocio, módulos, categorías, productos, impuestos y pagos, caja,
  equipo, dispositivos, catálogo público y ¡listo! Solo "Tu negocio" es obligatorio; el resto se
  puede omitir. Se retoma en el primer paso pendiente (`firstPendingStep`).
- **Se adapta al tipo de negocio** con `presetFor(type)` (`business/domain/presets.ts`, puro y
  probado): categorías, productos de ejemplo con precio editable, módulos recomendados, impuesto por
  defecto, medios de pago, roles sugeridos, base de caja y consejos. Todo editable antes de crear.
- Reutiliza los formularios existentes: `BusinessPanel`, `ModulesPanel`, `TaxesPanel`,
  `PaymentsPanel` (settings), `ProductImportPanel` (catalog), `RolesPanel`/`EmployeesPanel` (users),
  `TerminalsPanel` y `StorefrontPanel`.
- "Configurar después" guarda `dismissedAt` (no vuelve a redirigir); Inicio muestra
  `SetupBanner` con el avance hasta terminar. Al terminar se guarda `completedAt`.
- Al salir se espera a que el estado guardado lo refleje antes de navegar (si no, la redirección
  aún ve "pendiente").

## Tour

- `TourOverlay` (`shared/ui`): resalta el elemento con `data-tour="…"` (navegación `nav-<ruta>`,
  menú de usuario `user-menu`) y explica para qué sirve; foco atrapado, Esc para salir.
- Pasos en `app/tour.ts`, filtrados por permisos y módulos (un mesero no ve Reportes).
- Se muestra **una vez por persona** (`tourProgress/{uid}`: `done` o `skipped`) cuando el negocio
  ya está configurado; también a empleados nuevos. "Ver el tour otra vez" en el menú de usuario.
