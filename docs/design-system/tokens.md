---
title: Tokens de diseño
status: accepted
owner: diseño
updated: 2026-10-25
related: [principles.md, components.md]
---

# Tokens de diseño

Archivo fuente: `src/shared/ui/tokens/tokens.css` (variables `--sp-*`). Tailwind v4 los expone en
`src/app/styles/global.css` con `@theme inline` y **reinicia la paleta por defecto**
(`--color-*: initial`): solo existen colores del sistema.

| Grupo      | Tokens (clase Tailwind)                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Neutros    | `bg`, `surface`, `surface-muted`, `border`, `border-strong`, `text`, `text-muted`, `text-subtle` |
| Primario   | `primary`, `primary-hover`, `primary-fg`, `primary-soft`, `primary-soft-fg`                      |
| Semánticos | `success`, `warning`, `danger`, `info` + `-soft` y `-soft-fg`; `danger-hover`, `danger-fg`       |
| Otros      | `focus`, `overlay`, `chart-1` (serie única de gráficos)                                          |
| Tipografía | Inter Variable; 6 tamaños: `xs` 12, `sm` 14, `base` 16, `lg` 18, `xl` 24, `2xl` 32 px            |
| Espaciado  | escala de 4 px (`--spacing`); `touch` = 44 px                                                    |
| Radios     | `sm` 6, `md` 10, `lg` 14 px, `full`                                                              |
| Sombras    | `sm`, `md`, `lg`                                                                                 |
| Movimiento | `--sp-duration-fast/base/slow` (120/200/320 ms; 0 con _reduced motion_)                          |
| Capas      | `--sp-z-sticky/dropdown/overlay/modal/toast` (20–60), uso: `z-(--sp-z-modal)`                    |

Recetas compuestas reutilizadas por varios átomos (`inputClasses`, `popoverClasses`,
`menuItemClasses`) viven en `tokens/recipes.ts`, para que ningún átomo importe otro.

## Modo oscuro

`:root[data-theme='dark']` redefine los mismos tokens con pasos propios (no una inversión). El tema
se elige en el menú de usuario (automático → claro → oscuro) y se guarda en `localStorage`.
`chart-1` se validó con el validador de paletas para ambas superficies (banda de luminosidad y
contraste ≥ 3:1).

## Reglas

- Nunca colores hexadecimales en componentes; si falta un token, se agrega aquí y en `@theme`.
- El texto usa tokens de texto, nunca el color de una serie.
