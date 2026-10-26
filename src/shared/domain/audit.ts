import { z } from 'zod';

/** Versión del esquema de documentos. Subirla exige una migración documentada. */
export const SCHEMA_VERSION = 1;

/** Campos de auditoría presentes en todos los documentos de Firestore. */
export const auditFieldsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().min(1),
  schemaVersion: z.number().int().positive(),
});

export type AuditFields = z.infer<typeof auditFieldsSchema>;
