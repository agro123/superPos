import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { getOutbox } from '@/shared/infrastructure/offline/runtime';
import type { Outbox } from '@/shared/infrastructure/offline/outbox';
import {
  createCategory,
  createProduct,
  deleteCategory,
  importProducts,
  updateCategory,
  updateProduct,
  watchCategories,
  watchProducts,
} from '../infrastructure/catalogRepository';
import {
  PRODUCT_IMAGE_OPERATION,
  uploadProductImage,
  type ProductImagePayload,
} from '../infrastructure/productImageUpload';

export const useProducts = (bid: string) => useLiveQuery(['products', bid], watchProducts(bid));
export const useCategories = (bid: string) =>
  useLiveQuery(['categories', bid], watchCategories(bid));

/** Registra los handlers del outbox de esta feature (lo llama `app/` al arrancar). */
export function registerCatalogOutboxHandlers(outbox: Pick<Outbox, 'registerHandler'>): void {
  outbox.registerHandler(PRODUCT_IMAGE_OPERATION, uploadProductImage);
}

/** Encola la subida de una imagen (Storage no encola offline; el outbox sí). */
function queueProductImage(payload: ProductImagePayload): void {
  const outbox = getOutbox();
  void outbox.enqueue(PRODUCT_IMAGE_OPERATION, payload).then(() => outbox.processDue());
}

/** Escrituras del catálogo: optimistas y encoladas offline (no se esperan en la UI). */
export const catalogWrites = {
  createProduct,
  updateProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  queueProductImage,
  importProducts,
};
