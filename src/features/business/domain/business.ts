import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { isValidTimeZone } from '@/shared/domain/dates';
import { CURRENCY_CODES } from '@/shared/domain/money';
import { defineStateMachine } from '@/shared/domain/stateMachine';
import { rateBpsSchema } from '@/shared/domain/schemas';

export const BUSINESS_TYPES = ['store', 'cafe', 'restaurant', 'other'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Plan comercial. Las funciones premium aún no están definidas (ADR 0010). */
export const BUSINESS_PLANS = ['free', 'premium'] as const;
export type BusinessPlan = (typeof BUSINESS_PLANS)[number];

/** Estado operativo que controla la plataforma. Solo `active` permite operar. */
export const BUSINESS_STATUSES = ['active', 'blocked', 'deleted'] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

/**
 * Ciclo de vida del negocio (L8). `deleted` es un borrado lógico y reversible: los datos se
 * conservan hasta que una purga del servidor los elimine. `firestore.rules` replica esta tabla.
 */
export const businessStatusMachine = defineStateMachine<BusinessStatus>('businessStatus', {
  active: ['blocked', 'deleted'],
  blocked: ['active', 'deleted'],
  deleted: ['active'],
});

export const businessNameSchema = z
  .string()
  .trim()
  .min(2, { error: 'Mínimo 2 caracteres' })
  .max(80, { error: 'Máximo 80 caracteres' });

export const timeZoneSchema = z
  .string()
  .refine(isValidTimeZone, { error: 'Zona horaria inválida' });

/**
 * `businesses/{businessId}`. La moneda es inmutable tras crear el negocio (ADR 0005).
 * `plan` y `status` solo los cambia el super administrador (ADR 0010).
 */
export const businessSchema = z
  .object({
    id: z.string().min(1),
    name: businessNameSchema,
    type: z.enum(BUSINESS_TYPES),
    currency: z.enum(CURRENCY_CODES),
    timezone: timeZoneSchema,
    /** `null` si lo creó la plataforma y el dueño invitado aún no acepta. */
    ownerUid: z.string().min(1).nullable(),
    // Negocios anteriores al módulo de plataforma no tienen estos campos.
    plan: z.enum(BUSINESS_PLANS).default('free'),
    status: z.enum(BUSINESS_STATUSES).default('active'),
  })
  .extend(auditFieldsSchema.shape);

export type Business = z.infer<typeof businessSchema>;

/** Formulario de onboarding: crea el negocio, el miembro admin y la configuración inicial. */
export const onboardingInputSchema = z.object({
  name: businessNameSchema,
  type: z.enum(BUSINESS_TYPES),
  currency: z.enum(CURRENCY_CODES),
  timezone: timeZoneSchema,
  defaultTaxRateBps: rateBpsSchema,
  pricesIncludeTax: z.boolean(),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

/** Datos editables del negocio en Configuración. */
export const businessUpdateSchema = z.object({
  name: businessNameSchema,
  timezone: timeZoneSchema,
});
export type BusinessUpdate = z.infer<typeof businessUpdateSchema>;
