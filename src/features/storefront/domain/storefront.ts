import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { CURRENCY_CODES, type Money } from '@/shared/domain/money';
import { moneySchema, optionalText } from '@/shared/domain/schemas';

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const EMAIL_PROVIDERS = ['app', 'gmail', 'outlook', 'custom'] as const;

/** "Tienda Doña Rosa" → "tienda-dona-rosa" (sin tildes ni símbolos, 3–40 caracteres). */
export function suggestSlug(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return slug.length >= 3 ? slug : `tienda-${slug || 'pos'}`;
}

/** `businesses/{bid}/settings/publicCatalog`: lo que el dueño decide publicar. */
export const storefrontSettingsSchema = z.object({
  enabled: z.boolean(),
  slug: z.string().regex(SLUG_PATTERN),
  title: z.string().trim().min(1).max(80),
  description: optionalText(300),
  /** Número de WhatsApp de la tienda (solo dígitos con indicativo) para pedidos a domicilio. */
  whatsapp: z
    .string()
    .regex(/^[0-9]{8,15}$/)
    .nullable(),
  showOutOfStock: z.boolean(),
  visibleProductIds: z.array(z.string()).max(500),
  emailProvider: z.enum(EMAIL_PROVIDERS),
  emailCustomUrl: z.string().startsWith('https://').max(500).nullable(),
});
export type StorefrontSettings = z.infer<typeof storefrontSettingsSchema>;

export const defaultStorefrontSettings = (businessName: string): StorefrontSettings => ({
  enabled: false,
  slug: suggestSlug(businessName),
  title: businessName,
  description: null,
  whatsapp: null,
  showOutOfStock: false,
  visibleProductIds: [],
  emailProvider: 'app',
  emailCustomUrl: null,
});

/** `publicCatalogs/{slug}`: cabecera pública (lectura sin sesión). */
export const publicCatalogSchema = z
  .object({
    id: z.string().min(1),
    businessId: z.string().min(1),
    enabled: z.boolean(),
    title: z.string().min(1),
    description: z.string().nullable(),
    whatsapp: z.string().nullable(),
    currency: z.enum(CURRENCY_CODES),
  })
  .extend(auditFieldsSchema.shape);
export type PublicCatalog = z.infer<typeof publicCatalogSchema>;

/** `publicCatalogs/{slug}/products/{productId}`: solo datos que el dueño decidió mostrar. */
export const publicItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    priceMinor: moneySchema,
    imageUrl: z.string().nullable(),
    categoryName: z.string().nullable(),
    available: z.boolean(),
    sortOrder: z.number().int(),
  })
  .extend(auditFieldsSchema.shape);
export type PublicItem = z.infer<typeof publicItemSchema>;
export type PublicItemFields = Omit<PublicItem, 'id' | keyof z.infer<typeof auditFieldsSchema>>;

export interface CatalogSource {
  id: string;
  name: string;
  priceMinor: Money;
  imageUrl: string | null;
  categoryId: string | null;
  active: boolean;
  trackStock: boolean;
  stock: number;
}

/** Lo que debería estar publicado: productos activos y visibles (y agotados solo si se permite). */
export function buildPublicItems(
  products: readonly CatalogSource[],
  categories: readonly { id: string; name: string }[],
  settings: Pick<StorefrontSettings, 'visibleProductIds' | 'showOutOfStock'>,
): Map<string, PublicItemFields> {
  const visible = new Set(settings.visibleProductIds);
  const result = new Map<string, PublicItemFields>();
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  sorted.forEach((product, index) => {
    if (!product.active || !visible.has(product.id)) return;
    const available = !product.trackStock || product.stock > 0;
    if (!available && !settings.showOutOfStock) return;
    result.set(product.id, {
      name: product.name,
      priceMinor: product.priceMinor,
      imageUrl: product.imageUrl,
      categoryName: categories.find((c) => c.id === product.categoryId)?.name ?? null,
      available,
      sortOrder: index,
    });
  });
  return result;
}

const sameItem = (a: PublicItemFields, b: PublicItemFields) =>
  a.name === b.name &&
  a.priceMinor === b.priceMinor &&
  a.imageUrl === b.imageUrl &&
  a.categoryName === b.categoryName &&
  a.available === b.available &&
  a.sortOrder === b.sortOrder;

/** Cambios mínimos entre lo deseado y lo publicado (para no reescribir todo el catálogo). */
export function diffPublicItems(
  desired: ReadonlyMap<string, PublicItemFields>,
  published: readonly PublicItem[],
): { upserts: [string, PublicItemFields][]; deletes: string[] } {
  const current = new Map(published.map((item) => [item.id, item]));
  const upserts = [...desired].filter(([id, fields]) => {
    const existing = current.get(id);
    return !existing || !sameItem(existing, fields);
  });
  const deletes = published.filter((item) => !desired.has(item.id)).map((item) => item.id);
  return { upserts, deletes };
}

export const catalogUrl = (origin: string, slug: string) => `${origin}/c/${slug}`;
