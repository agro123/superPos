import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { moneySchema, optionalText, rateBpsSchema } from '@/shared/domain/schemas';

const productFields = {
  name: z
    .string()
    .trim()
    .min(1, { error: 'Escribe el nombre' })
    .max(120, { error: 'Máximo 120 caracteres' }),
  sku: optionalText(40),
  barcode: optionalText(64),
  categoryId: z.string().min(1).nullable(),
  /** Precio de venta en unidad mínima. Fuente única del precio en una venta (L6). */
  priceMinor: moneySchema,
  costMinor: moneySchema.nullable(),
  taxRateBps: rateBpsSchema,
  trackStock: z.boolean(),
  lowStockThreshold: z.number().nonnegative(),
  active: z.boolean(),
};

/** `businesses/{bid}/products/{productId}`. El stock solo cambia con `increment()` (ADR 0003). */
export const productSchema = z
  .object({
    id: z.string().min(1),
    ...productFields,
    stock: z.number(),
    imageUrl: z.url().nullable(),
  })
  .extend(auditFieldsSchema.shape);

export type Product = z.infer<typeof productSchema>;

/** Formulario de producto. El stock inicial solo se fija al crear. */
export const productInputSchema = z.object({
  ...productFields,
  initialStock: z.number().nonnegative(),
});
export type ProductInput = z.input<typeof productInputSchema>;
export type ValidProductInput = z.output<typeof productInputSchema>;

/** Tamaño máximo de imagen de producto (también lo exige storage.rules). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Busca un producto activo por código de barras exacto (lector = teclado rápido + Enter). */
export function findByBarcode(products: readonly Product[], code: string): Product | undefined {
  const needle = code.trim();
  return needle
    ? products.find((product) => product.active && product.barcode === needle)
    : undefined;
}
