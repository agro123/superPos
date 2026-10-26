import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { optionalText } from '@/shared/domain/schemas';

export const MOVEMENT_TYPES = ['sale', 'void', 'adjustment', 'purchase'] as const;

/** `businesses/{bid}/inventoryMovements/{id}`: bitácora inmutable de cambios de stock. */
export const inventoryMovementSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string().min(1),
    type: z.enum(MOVEMENT_TYPES),
    quantityDelta: z.number(),
    reason: optionalText(200),
    saleId: z.string().nullable(),
  })
  .extend(auditFieldsSchema.shape);

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;

/** `businesses/{bid}/suppliers/{id}`. */
export const supplierSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(120),
    phone: optionalText(30),
    email: z.email().nullable(),
  })
  .extend(auditFieldsSchema.shape);

export type Supplier = z.infer<typeof supplierSchema>;
