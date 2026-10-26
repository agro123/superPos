---
title: Atomic design
status: accepted
owner: diseño
updated: 2026-10-25
related: [components.md, ../architecture/overview.md]
---

# Atomic design

## Niveles y criterio para clasificar

| Nivel     | Criterio                                      | Carpeta                |
| --------- | --------------------------------------------- | ---------------------- |
| Átomo     | No se puede dividir más sin perder su función | `shared/ui/atoms/`     |
| Molécula  | Grupo pequeño con **una** responsabilidad     | `shared/ui/molecules/` |
| Organismo | Sección autónoma de la interfaz               | `shared/ui/organisms/` |
| Template  | Esqueleto de página: distribución, sin datos  | `shared/ui/templates/` |
| Página    | Rellena templates con datos reales            | `features/*/pages/`    |

## Reglas de dependencia (las hace cumplir ESLint)

- Un **átomo** no importa nada de `shared/ui` salvo `tokens/` (ni siquiera otro átomo).
- Una **molécula** importa átomos (y tokens).
- Un **organismo** importa moléculas y átomos; **no otros organismos**. Si necesita uno, lo recibe
  como _slot_ (p. ej. `PaymentSheet` recibe el `Numpad` en la prop `keypad`).
- Un **template** compone organismos y define la distribución, sin datos.
- `shared/ui` nunca importa `shared/infrastructure` ni features.

Las zonas se generan por componente en `eslint.config.js` (`atomicDesignZones`).

## Sin lógica de negocio

Átomos y moléculas son presentacionales y controlados por props. Los organismos reciben datos ya
resueltos y formateados (p. ej. `CartPanelLine.totalLabel`), nunca llaman a Firebase ni a
repositorios. Los hooks de datos viven en `features/*/application/`.

## Componentes de una feature

`features/<x>/ui/` sigue la misma jerarquía y compone `shared/ui`. **Si un componente se usa en
dos features, se promueve a `shared/ui`** (y se agrega a `/dev/ui` y a [components](components.md)).

## Estructura por componente

```text
ComponentName/
├── ComponentName.tsx       # props tipadas y documentadas con JSDoc; variantes con cva
├── ComponentName.test.tsx  # al menos una prueba de comportamiento
└── index.ts                # export * from './ComponentName'
```

Y se exporta desde `shared/ui/index.ts`.
