import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { optionalText } from '@/shared/domain/schemas';

const customerFields = {
  name: z
    .string()
    .trim()
    .min(2, { error: 'Mínimo 2 caracteres' })
    .max(120, { error: 'Máximo 120 caracteres' }),
  /** Cédula o NIT. */
  documentId: optionalText(20),
  phone: optionalText(30),
  email: z
    .union([z.email({ error: 'Email inválido' }), z.literal('')])
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  notes: optionalText(500),
};

/** `businesses/{bid}/customers/{id}`. Módulo opcional por negocio. */
export const customerSchema = z
  .object({ id: z.string().min(1), ...customerFields, email: z.email().nullable() })
  .extend(auditFieldsSchema.shape);

export type Customer = z.infer<typeof customerSchema>;

export const customerInputSchema = z.object(customerFields);
export type CustomerInput = z.input<typeof customerInputSchema>;
