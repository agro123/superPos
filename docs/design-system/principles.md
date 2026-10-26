---
title: Principios de diseño
status: accepted
owner: diseño
updated: 2026-10-25
related: [tokens.md, atomic-design.md, components.md]
---

# Principios de diseño

1. **Minimalista y claro**: mucho espacio, una acción primaria por pantalla, máximo 2 niveles de
   navegación (sección → ítem).
2. **Táctil primero** (tablet y móvil), usable en escritorio. Objetivos táctiles ≥ 44×44 px
   (`min-h-touch`, `size-touch`); checkbox y switch amplían su área con un pseudo-elemento.
3. **Velocidad de caja**: vender en ≤ 3 toques; lector de código de barras (`useBarcodeScanner`);
   atajos F2 (buscar) y F9 (cobrar) en escritorio.
4. **Accesibilidad WCAG 2.2 AA**: contraste de tokens, foco visible (`:focus-visible`), teclado,
   ARIA correcto (Radix), "Saltar al contenido", `prefers-reduced-motion` (duraciones a 0).
   El significado nunca depende solo del color (badges con texto, íconos con etiqueta).
5. **Modo claro y oscuro** por tokens (`data-theme`), con preferencia del sistema por defecto.
6. **Estados siempre diseñados**: carga (`Skeleton`), vacío con llamada a la acción (`EmptyState`),
   error con reintento, sin conexión (banner + `SyncStatusBadge` + "pendiente de sincronizar").
7. **Textos en español (es-CO)** vía i18n; dinero y fechas con `Intl`.
