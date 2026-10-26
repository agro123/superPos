import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { PAYMENT_METHODS, type PaymentMethod } from '@/shared/domain/payment';
import { rateBpsSchema } from '@/shared/domain/schemas';
import type { BusinessType } from './business';

/** Ids de documentos en `businesses/{bid}/settings/{id}`. */
export const SETTINGS_DOCS = ['modules', 'taxes', 'paymentMethods'] as const;
export type SettingsDocId = (typeof SETTINGS_DOCS)[number];

/** Módulos activables por negocio. */
export const MODULE_IDS = ['restaurant', 'customers'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export const modulesSettingsSchema = z
  .object({ restaurant: z.boolean(), customers: z.boolean() })
  .extend(auditFieldsSchema.shape);
export type ModulesSettings = z.infer<typeof modulesSettingsSchema>;

export const taxRateSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(40),
  rateBps: rateBpsSchema,
});
export type TaxRate = z.infer<typeof taxRateSchema>;

export const taxSettingsSchema = z
  .object({
    /** `true`: los precios del catálogo ya incluyen el impuesto (habitual en Colombia). */
    pricesIncludeTax: z.boolean(),
    defaultRateBps: rateBpsSchema,
    rates: z.array(taxRateSchema).max(20),
  })
  .extend(auditFieldsSchema.shape);
export type TaxSettings = z.infer<typeof taxSettingsSchema>;

export const paymentMethodsSettingsSchema = z
  .object({ enabled: z.array(z.enum(PAYMENT_METHODS)).min(1) })
  .extend(auditFieldsSchema.shape);
export type PaymentMethodsSettings = z.infer<typeof paymentMethodsSettingsSchema>;

/** Módulos activos por defecto según el tipo de negocio. */
export function defaultModulesFor(type: BusinessType): Pick<ModulesSettings, ModuleId> {
  return { restaurant: type === 'restaurant', customers: true };
}

/** Tasas de impuesto por defecto (IVA colombiano). */
export function defaultTaxRates(): TaxRate[] {
  return [
    { id: 'iva19', name: 'IVA 19 %', rateBps: 1900 },
    { id: 'iva5', name: 'IVA 5 %', rateBps: 500 },
    { id: 'exento', name: 'Exento', rateBps: 0 },
  ];
}

export const DEFAULT_PAYMENT_METHODS: readonly PaymentMethod[] = ['cash', 'card', 'transfer'];
