import type { Subscribe } from '@/shared/domain/live';
import type { Sale } from './sale';
import type { StockDecrement } from './stock';

/** Venta lista para persistir (sin campos de auditoría, que añade la infraestructura). */
export type NewSale = Omit<Sale, 'createdAt' | 'updatedAt' | 'createdBy' | 'schemaVersion'>;

/** Venta leída con su estado de sincronización. */
export type SaleRecord = Sale & { pendingSync: boolean };

/** Lectura de ventas en tiempo real (implementada en `infrastructure/saleRepository.ts`). */
export interface SaleReader {
  watchSince(businessId: string, since: Date): Subscribe<SaleRecord[]>;
}

/**
 * Registro de ventas. `record` DEBE escribir la venta, los descuentos de stock (`increment`) y los
 * movimientos de inventario en un único `writeBatch` atómico, que funciona sin conexión (L1, ADR 0003).
 * Se implementa en la fase de funcionalidades (Prompt 2).
 */
export interface SaleWriter {
  record(businessId: string, sale: NewSale, stock: readonly StockDecrement[]): void;
}
