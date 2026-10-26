---
title: Plataforma — PWA hoy, Tauri mañana
status: accepted
owner: equipo frontend
updated: 2026-10-25
related: [overview.md, offline-sync.md]
---

# Plataforma — PWA hoy, Tauri mañana

## Hoy: PWA

- App 100 % estática (`vite build` → `dist/`), instalable (manifest + íconos en `public/`).
- Service Worker con `registerType: 'prompt'`: se registra al arrancar (`app/pwa.ts`), avisa
  "ya funciona sin conexión" y muestra "nueva versión disponible" (`UpdatePrompt`) sin recargar a la fuerza.
- Precache del app shell y de todos los chunks (incluidos los de rutas diferidas) y de la fuente
  Inter (subconjuntos latinos). El chunk del SDK de Firebase (~680 kB) va aparte para cachearse
  entre versiones.

## Mañana: Tauri

Para que el mismo `dist/` funcione en Tauri:

- Prohibido en `src/`: APIs de Node, `window.require`, Electron, rutas absolutas del sistema (ESLint).
- Toda capacidad nativa va detrás de `PlatformAdapter` (`shared/infrastructure/platform/`):

```ts
interface PlatformAdapter {
  readonly kind: 'web' | 'tauri';
  deviceCode(): string; // web: localStorage; Tauri: id de máquina
  printReceipt(receipt): Promise<Result<void>>; // web: iframe + window.print; Tauri: impresora térmica ESC/POS
  openCashDrawer(): Promise<Result<void>>; // web: unsupported; Tauri: pulso al cajón
}
```

- `getPlatform()` elegirá la implementación (p. ej. detectando `window.__TAURI_INTERNALS__`).
  Las features solo llaman a hooks de `application/` que usan el adaptador.
- Firebase JS SDK funciona igual dentro del WebView de Tauri; la persistencia sigue en IndexedDB.

## Pendiente para escritorio

- Adaptador Tauri (impresora térmica y cajón), actualización automática de Tauri en vez del SW.
