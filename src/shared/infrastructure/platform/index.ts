import type { PlatformAdapter } from './PlatformAdapter';
import { createWebPlatformAdapter } from './webPlatformAdapter';

export type { PlatformAdapter, ReceiptDocument } from './PlatformAdapter';

let adapter: PlatformAdapter | null = null;

/** Adaptador de plataforma activo. Cuando exista la versión Tauri, se elegirá aquí. */
export function getPlatform(): PlatformAdapter {
  adapter ??= createWebPlatformAdapter();
  return adapter;
}
