# SuperPOS

Punto de venta **offline-first** para pequeños negocios (tiendas, minimercados, cafeterías y
restaurantes pequeños). PWA en React + TypeScript con Firebase (Auth, Firestore, Storage, Hosting,
App Check) y sin backend propio.

> Prototipo — fase 1: estructura, sistema de diseño, pantallas, autenticación, permisos e
> infraestructura offline. El registro de ventas, caja e inventario llega en la fase 2.

## Inicio rápido

```bash
pnpm install
cp .env.example .env.local
pnpm emulators          # terminal 1 (requiere Java 21+)
pnpm seed               # terminal 2: datos de ejemplo
pnpm dev                # http://localhost:5173 — p. ej. ana@superpos.test / superpos123
```

| Comando                                           |                                                               |
| ------------------------------------------------- | ------------------------------------------------------------- |
| `pnpm check`                                      | typecheck + lint + formato + unitarias + reglas + build + e2e |
| `pnpm test` / `pnpm test:rules` / `pnpm test:e2e` | pruebas por tipo                                              |
| `pnpm build && pnpm preview`                      | build de producción con Service Worker                        |

## Documentación

- [docs/README.md](docs/README.md) — índice y orden de lectura
- [CLAUDE.md](CLAUDE.md) — reglas del proyecto para personas y agentes
- [Primeros pasos](docs/guides/getting-started.md) · [Arquitectura](docs/architecture/overview.md) · [Seguridad](docs/architecture/security.md)
