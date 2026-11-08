import { collection, doc, updateDoc, writeBatch, type WriteBatch } from 'firebase/firestore';
import type { LiveDoc, Subscribe, Synced } from '@/shared/domain/live';
import type { CurrencyCode } from '@/shared/domain/money';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import {
  createAudit,
  updateAudit,
  watchDoc,
  watchQuery,
} from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import { z } from 'zod';
import {
  publicCatalogSchema,
  publicItemSchema,
  storefrontSettingsSchema,
  type PublicCatalog,
  type PublicItem,
  type PublicItemFields,
  type StorefrontSettings,
} from '../domain/storefront';

const db = () => getFirebase().db;
const settingsConverter = zodConverter(storefrontSettingsSchema.extend({ id: z.string() }));
const catalogConverter = zodConverter(publicCatalogSchema);
const itemConverter = zodConverter(publicItemSchema);
const settingsRef = (bid: string) => doc(db(), 'businesses', bid, 'settings', 'publicCatalog');
const catalogRef = (slug: string) => doc(db(), 'publicCatalogs', slug);
const itemsCol = (slug: string) => collection(db(), 'publicCatalogs', slug, 'products');
/** Firestore admite 500 escrituras por batch; se deja margen. */
const BATCH_LIMIT = 400;

export const watchStorefrontSettings = (bid: string): Subscribe<LiveDoc<StorefrontSettings>> =>
  watchDoc(settingsRef(bid).withConverter(settingsConverter));

/** Funciona sin sesión: es lo que lee la página pública. */
export const watchPublicCatalog = (slug: string): Subscribe<LiveDoc<PublicCatalog>> =>
  watchDoc(catalogRef(slug).withConverter(catalogConverter));

export const watchPublicItems = (slug: string): Subscribe<Synced<PublicItem>[]> =>
  watchQuery(itemsCol(slug).withConverter(itemConverter));

/**
 * Guarda la configuración. Si cambió el slug, despublica el anterior en el mismo batch para que
 * el enlace viejo deje de mostrar productos.
 */
export function saveStorefrontSettings(
  bid: string,
  settings: StorefrontSettings,
  previous: { slug: string; published: boolean } | null,
  uid: string,
): void {
  const batch = writeBatch(db());
  batch.set(
    settingsRef(bid),
    { ...settings, ...(previous ? updateAudit() : createAudit(uid)) },
    { merge: true },
  );
  if (previous?.published && previous.slug !== settings.slug) {
    batch.update(catalogRef(previous.slug), { enabled: false, ...updateAudit() });
  }
  trackWrite(batch.commit(), 'storefront.settings');
}

export interface PublishInput {
  businessId: string;
  slug: string;
  header: {
    enabled: boolean;
    title: string;
    description: string | null;
    whatsapp: string | null;
    currency: CurrencyCode;
  };
  /** `true` si el documento del catálogo ya existe (auditoría de creación vs. actualización). */
  headerExists: boolean;
  upserts: readonly [string, PublicItemFields][];
  existingIds: ReadonlySet<string>;
  deletes: readonly string[];
  uid: string;
}

/**
 * Publica la cabecera y los cambios de productos en lotes (sin esperar: el SDK los envía en
 * orden, así la cabecera llega antes que sus productos).
 */
export function publishCatalog(input: PublishInput): void {
  const ops: ((batch: WriteBatch) => void)[] = [
    (batch) => {
      batch.set(
        catalogRef(input.slug),
        {
          businessId: input.businessId,
          ...input.header,
          ...(input.headerExists ? updateAudit() : createAudit(input.uid)),
        },
        { merge: input.headerExists },
      );
    },
    ...input.upserts.map(([id, fields]) => (batch: WriteBatch) => {
      const exists = input.existingIds.has(id);
      batch.set(
        doc(itemsCol(input.slug), id),
        { ...fields, ...(exists ? updateAudit() : createAudit(input.uid)) },
        { merge: exists },
      );
    }),
    ...input.deletes.map((id) => (batch: WriteBatch) => {
      batch.delete(doc(itemsCol(input.slug), id));
    }),
  ];
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db());
    for (const op of ops.slice(i, i + BATCH_LIMIT)) op(batch);
    trackWrite(batch.commit(), 'storefront.publish');
  }
}

/** Despublica (el enlace muestra "catálogo no disponible"). */
export function unpublishCatalog(slug: string): void {
  trackWrite(
    updateDoc(catalogRef(slug), { enabled: false, ...updateAudit() }),
    'storefront.unpublish',
  );
}
