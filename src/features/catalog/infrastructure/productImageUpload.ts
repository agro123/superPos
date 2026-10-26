import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { z } from 'zod';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { mapFirebaseError } from '@/shared/infrastructure/firebase/errors';
import { updateAudit } from '@/shared/infrastructure/firebase/firestore';
import type { OutboxHandler } from '@/shared/infrastructure/offline/outbox';

export const PRODUCT_IMAGE_OPERATION = 'catalog.productImage';

const payloadSchema = z.object({
  businessId: z.string().min(1),
  productId: z.string().min(1),
  image: z.instanceof(Blob),
});

export type ProductImagePayload = z.infer<typeof payloadSchema>;

/**
 * Sube la imagen y guarda su URL en el producto. Idempotente: siempre escribe la misma ruta,
 * así que repetirla tras un fallo parcial deja el mismo resultado.
 */
export const uploadProductImage: OutboxHandler = async (payload) => {
  const { businessId, productId, image } = payloadSchema.parse(payload);
  const { storage, db } = getFirebase();
  try {
    const target = ref(storage, `businesses/${businessId}/products/${productId}/image`);
    await uploadBytes(target, image, { contentType: image.type });
    const imageUrl = await getDownloadURL(target);
    await updateDoc(doc(db, 'businesses', businessId, 'products', productId), {
      imageUrl,
      ...updateAudit(),
    });
  } catch (error) {
    throw mapFirebaseError(error);
  }
};
