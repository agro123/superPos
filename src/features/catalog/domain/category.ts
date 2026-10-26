import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';

/** Colores de categoría: claves de tono del sistema de diseño, no colores libres. */
export const CATEGORY_COLORS = [
  'primary',
  'success',
  'warning',
  'danger',
  'info',
  'neutral',
] as const;

const categoryFields = {
  name: z
    .string()
    .trim()
    .min(1, { error: 'Escribe el nombre' })
    .max(40, { error: 'Máximo 40 caracteres' }),
  color: z.enum(CATEGORY_COLORS),
  sortOrder: z.number().int().min(0),
};

/** `businesses/{bid}/categories/{categoryId}`. */
export const categorySchema = z
  .object({ id: z.string().min(1), ...categoryFields })
  .extend(auditFieldsSchema.shape);

export type Category = z.infer<typeof categorySchema>;

export const categoryInputSchema = z.object(categoryFields);
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export function sortCategories(categories: readonly Category[]): Category[] {
  return [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'),
  );
}
