import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { PAYMENT_STATUSES, TENDER_METHODS } from '@/shared/domain/payment';
import { moneySchema, rateBpsSchema } from '@/shared/domain/schemas';
import { defineStateMachine } from '@/shared/domain/stateMachine';

/**
 * Flujo de cobro en el cliente. Solo `completed` se persiste: la venta es inmutable
 * y una anulación es un documento nuevo de tipo `void` (L6, L8).
 */
export const SALE_STATUSES = ['draft', 'awaiting_payment', 'completed', 'cancelled'] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const saleStatusMachine = defineStateMachine<SaleStatus>('sale', {
  draft: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['draft', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
});

/** Snapshot de la línea: nombre, precio e impuesto al momento de vender. */
export const saleLineSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(120),
  unitPriceMinor: moneySchema,
  quantity: z.number().positive(),
  taxRateBps: rateBpsSchema,
  discountMinor: moneySchema,
  voided: z.boolean(),
  /** Costo unitario al vender (margen exacto). Ausente en ventas anteriores a este campo. */
  unitCostMinor: moneySchema.nullable().default(null),
});
export type SaleLine = z.infer<typeof saleLineSchema>;

export const salePaymentSchema = z.object({
  method: z.enum(TENDER_METHODS),
  amountMinor: moneySchema,
  status: z.enum(PAYMENT_STATUSES),
  reference: z.string().max(120).nullable(),
});
export type SalePayment = z.infer<typeof salePaymentSchema>;

/** `businesses/{bid}/sales/{saleId}`. Inmutable: las reglas niegan update y delete. */
export const saleSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['sale', 'void']),
    number: z.string().min(1),
    deviceCode: z.string().min(1),
    lines: z.array(saleLineSchema).min(1).max(200),
    subtotalMinor: moneySchema,
    discountMinor: moneySchema,
    taxMinor: moneySchema,
    totalMinor: moneySchema,
    payments: z.array(salePaymentSchema).max(10),
    changeMinor: moneySchema,
    /** Parte fiada (pagos `credit`): cuenta por cobrar del cliente. Exige `customerId`. */
    creditMinor: moneySchema,
    customerId: z.string().nullable(),
    cashShiftId: z.string().nullable(),
    /** Terminal POS desde el que se vendió; `null` solo para un admin en su propio equipo. */
    terminalId: z.string().nullable(),
    /** Solo en documentos `void`: la venta anulada y el motivo. */
    voidedSaleId: z.string().nullable(),
    voidReason: z.string().max(200).nullable(),
    /** Momento real de la venta en el dispositivo (puede ser anterior a la sincronización). */
    occurredAt: z.date(),
  })
  .extend(auditFieldsSchema.shape);

export type Sale = z.infer<typeof saleSchema>;

/** Ids de ventas anuladas a partir de los documentos `void`. */
export function voidedSaleIds(sales: readonly Sale[]): ReadonlySet<string> {
  return new Set(
    sales.flatMap((sale) => (sale.type === 'void' && sale.voidedSaleId ? [sale.voidedSaleId] : [])),
  );
}
