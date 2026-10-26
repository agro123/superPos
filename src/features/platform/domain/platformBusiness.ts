import { z } from 'zod';
import {
  BUSINESS_PLANS,
  BUSINESS_TYPES,
  businessNameSchema,
  timeZoneSchema,
  type Business,
  type BusinessStatus,
} from '@/features/business';
import { CURRENCY_CODES } from '@/shared/domain/money';

/** Alta de un negocio desde la plataforma: el dueño recibe una invitación como admin. */
export const platformBusinessInputSchema = z.object({
  name: businessNameSchema,
  type: z.enum(BUSINESS_TYPES),
  currency: z.enum(CURRENCY_CODES),
  timezone: timeZoneSchema,
  plan: z.enum(BUSINESS_PLANS),
  ownerEmail: z
    .string()
    .transform((email) => email.trim().toLowerCase())
    .pipe(z.email({ error: 'Escribe un email válido' })),
});
export type PlatformBusinessInput = z.infer<typeof platformBusinessInputSchema>;

/** Datos que el super admin puede editar (tipo y moneda son inmutables, ADR 0005). */
export const platformBusinessUpdateSchema = z.object({
  name: businessNameSchema,
  timezone: timeZoneSchema,
  plan: z.enum(BUSINESS_PLANS),
});
export type PlatformBusinessUpdate = z.infer<typeof platformBusinessUpdateSchema>;

/** Colecciones de `businesses/{bid}` que se cuentan en el detalle de uso. */
export const USAGE_COLLECTIONS = [
  'members',
  'invitations',
  'products',
  'categories',
  'inventoryMovements',
  'suppliers',
  'customers',
  'sales',
  'cashShifts',
  'restaurantZones',
  'restaurantTables',
] as const;
export type UsageCollection = (typeof USAGE_COLLECTIONS)[number];

export type UsageCounts = Readonly<Record<UsageCollection, number>>;

/** Total de documentos de un reporte de uso. */
export function totalRecords(counts: UsageCounts): number {
  return USAGE_COLLECTIONS.reduce((total, collection) => total + counts[collection], 0);
}

export type StatusFilter = BusinessStatus | 'all';

/** Filtra por estado. Los eliminados solo aparecen si se piden explícitamente. */
export function filterByStatus<T extends Pick<Business, 'status'>>(
  businesses: readonly T[],
  status: StatusFilter,
): T[] {
  return businesses.filter((business) =>
    status === 'all' ? business.status !== 'deleted' : business.status === status,
  );
}

export interface PlatformSummary {
  total: number;
  premium: number;
  blocked: number;
}

/** Resumen para la cabecera del panel (excluye eliminados). */
export function summarize(
  businesses: readonly Pick<Business, 'plan' | 'status'>[],
): PlatformSummary {
  const live = businesses.filter((business) => business.status !== 'deleted');
  return {
    total: live.length,
    premium: live.filter((business) => business.plan === 'premium').length,
    blocked: live.filter((business) => business.status === 'blocked').length,
  };
}
