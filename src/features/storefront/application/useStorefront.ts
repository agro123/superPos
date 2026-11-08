import { useEffect, useMemo, useRef } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { useCategories, useProducts } from '@/features/catalog';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import type { EmailProvider } from '@/shared/lib/share';
import {
  buildPublicItems,
  defaultStorefrontSettings,
  diffPublicItems,
  type StorefrontSettings,
} from '../domain/storefront';
import {
  publishCatalog,
  unpublishCatalog,
  watchPublicCatalog,
  watchPublicItems,
  watchStorefrontSettings,
} from '../infrastructure/storefrontRepository';

export { saveStorefrontSettings } from '../infrastructure/storefrontRepository';

/** Configuración del catálogo público (o los valores por defecto si aún no existe). */
export function useStorefrontSettings(bid: string, businessName: string) {
  const query = useLiveQuery(['storefrontSettings', bid], watchStorefrontSettings(bid));
  const stored = query.data?.value ?? null;
  const settings: StorefrontSettings = stored ?? defaultStorefrontSettings(businessName);
  return { settings, exists: stored !== null, loading: query.isPending, error: query.error };
}

/** Proveedor de correo elegido por el admin (para compartir y enviar pedidos). */
export function useEmailPreference(bid: string): {
  provider: EmailProvider;
  customUrl: string | null;
} {
  const { business } = useActiveBusiness();
  const { settings } = useStorefrontSettings(bid, business.name);
  return { provider: settings.emailProvider, customUrl: settings.emailCustomUrl };
}

export const usePublicCatalog = (slug: string) =>
  useLiveQuery(['publicCatalog', slug], watchPublicCatalog(slug));

export const usePublicItems = (slug: string, enabled: boolean) =>
  useLiveQuery(['publicItems', slug], enabled ? watchPublicItems(slug) : null);

/** Espera tras el último cambio antes de publicar (agrupa ediciones seguidas). */
const PUBLISH_DELAY_MS = 1500;

/**
 * Mantiene publicado el catálogo mientras un usuario con `catalog.manage` tiene la app abierta:
 * compara lo deseado (productos visibles, precios, stock) con lo publicado y escribe solo las
 * diferencias. Sin servidor no hay otra forma de reflejar cambios de stock (ver ADR 0012).
 */
export function useStorefrontSync(enabled: boolean): void {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const { settings, exists } = useStorefrontSettings(business.id, business.name);
  const active = enabled && exists;
  const products = useProducts(business.id);
  const categories = useCategories(business.id);
  const header = useLiveQuery(
    ['publicCatalog', settings.slug],
    active ? watchPublicCatalog(settings.slug) : null,
  );
  const published = usePublicItems(settings.slug, active && settings.enabled);
  const lastSignature = useRef('');

  const plan = useMemo(() => {
    if (!active || !products.data || !categories.data || header.isPending) return null;
    const current = header.data?.value ?? null;
    if (!settings.enabled) return current?.enabled ? { unpublish: true as const } : null;
    if (published.isPending || !published.data) return null;
    const desired = buildPublicItems(products.data, categories.data, settings);
    const diff = diffPublicItems(desired, published.data);
    const next = {
      enabled: true,
      title: settings.title,
      description: settings.description,
      whatsapp: settings.whatsapp,
      currency: business.currency,
    };
    const headerChanged =
      current?.enabled !== next.enabled ||
      current.title !== next.title ||
      current.description !== next.description ||
      current.whatsapp !== next.whatsapp ||
      current.currency !== next.currency;
    if (!headerChanged && diff.upserts.length === 0 && diff.deletes.length === 0) return null;
    return {
      unpublish: false as const,
      input: {
        businessId: business.id,
        slug: settings.slug,
        header: next,
        headerExists: current !== null,
        upserts: diff.upserts,
        existingIds: new Set(published.data.map((item) => item.id)),
        deletes: diff.deletes,
        uid: user.uid,
      },
    };
  }, [
    active,
    products.data,
    categories.data,
    header.isPending,
    header.data,
    published.isPending,
    published.data,
    settings,
    business,
    user.uid,
  ]);

  useEffect(() => {
    if (!plan) return;
    const signature = plan.unpublish
      ? `off:${settings.slug}`
      : JSON.stringify([plan.input.header, plan.input.upserts, plan.input.deletes]);
    // Mientras la escritura local no se refleja, el mismo plan no se envía dos veces.
    if (signature === lastSignature.current) return;
    const timer = setTimeout(() => {
      lastSignature.current = signature;
      if (plan.unpublish) unpublishCatalog(settings.slug);
      else publishCatalog(plan.input);
    }, PUBLISH_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [plan, settings.slug]);
}
