import { z } from 'zod';
import { optionalText } from '@/shared/domain/schemas';

export const STOCK_CHANGE_MODES = ['purchase', 'adjustment'] as const;
export type StockChangeMode = (typeof STOCK_CHANGE_MODES)[number];

/**
 * Entrada de mercancía (`purchase`: unidades recibidas) o ajuste por conteo físico (`adjustment`:
 * unidades contadas). El ajuste exige motivo (merma, daño, conteo…).
 */
export const stockChangeInputSchema = z
  .object({
    mode: z.enum(STOCK_CHANGE_MODES),
    quantity: z.number().nonnegative().max(1_000_000),
    reason: optionalText(200),
    supplierId: z.string().nullable(),
  })
  .refine((v) => v.mode === 'adjustment' || v.quantity > 0, { path: ['quantity'] })
  .refine((v) => v.mode === 'purchase' || (v.reason?.length ?? 0) >= 3, { path: ['reason'] });
export type StockChangeInput = z.output<typeof stockChangeInputSchema>;

/** Diferencia a aplicar con `increment()`: compra = +recibidas; ajuste = contadas − actuales. */
export function stockDelta(mode: StockChangeMode, quantity: number, currentStock: number): number {
  return mode === 'purchase' ? quantity : quantity - currentStock;
}
