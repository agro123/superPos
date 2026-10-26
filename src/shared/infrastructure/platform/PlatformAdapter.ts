import type { Result } from '@/shared/domain/result';

/** Documento de ticket en texto plano (nunca HTML). */
export interface ReceiptDocument {
  title: string;
  lines: readonly { label: string; value: string }[];
  footer?: string;
}

/**
 * Capacidades nativas detrás de una interfaz (docs/architecture/platform-desktop.md).
 * Hoy: implementación web. Mañana: Tauri (impresora térmica, cajón de dinero) sin tocar features.
 */
export interface PlatformAdapter {
  readonly kind: 'web' | 'tauri';
  /** Código corto y estable de este dispositivo (numeración de ventas, turnos de caja). */
  deviceCode(): string;
  printReceipt(receipt: ReceiptDocument): Promise<Result<void>>;
  openCashDrawer(): Promise<Result<void>>;
}
