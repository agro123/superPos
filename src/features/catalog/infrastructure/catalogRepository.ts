import { collection, deleteDoc, doc, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import type { Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { createAudit, updateAudit, watchQuery } from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import { categorySchema, type Category, type CategoryInput } from '../domain/category';
import { productSchema, type Product, type ValidProductInput } from '../domain/product';

const db = () => getFirebase().db;
const productConverter = zodConverter(productSchema);
const categoryConverter = zodConverter(categorySchema);
const productsCol = (bid: string) => collection(db(), 'businesses', bid, 'products');
const categoriesCol = (bid: string) => collection(db(), 'businesses', bid, 'categories');

export const watchProducts = (bid: string): Subscribe<Synced<Product>[]> =>
  watchQuery(query(productsCol(bid), orderBy('name')).withConverter(productConverter));

export const watchCategories = (bid: string): Subscribe<Synced<Category>[]> =>
  watchQuery(query(categoriesCol(bid), orderBy('sortOrder')).withConverter(categoryConverter));

/** Crea un producto con id generado en cliente (funciona sin conexión). Devuelve el id. */
export function createProduct(bid: string, input: ValidProductInput, uid: string): string {
  const ref = doc(productsCol(bid));
  const { initialStock, ...fields } = input;
  trackWrite(
    setDoc(ref, { ...fields, stock: initialStock, imageUrl: null, ...createAudit(uid) }),
    'products.create',
  );
  return ref.id;
}

/** Edita un producto. El stock no se toca aquí: cambia con `increment()` (ventas, ajustes). */
export function updateProduct(bid: string, productId: string, input: ValidProductInput): void {
  const { initialStock: _ignored, ...fields } = input;
  trackWrite(
    updateDoc(doc(productsCol(bid), productId), { ...fields, ...updateAudit() }),
    'products.update',
  );
}

export function createCategory(bid: string, input: CategoryInput, uid: string): void {
  trackWrite(
    setDoc(doc(categoriesCol(bid)), { ...input, ...createAudit(uid) }),
    'categories.create',
  );
}

export function updateCategory(bid: string, categoryId: string, input: CategoryInput): void {
  trackWrite(
    updateDoc(doc(categoriesCol(bid), categoryId), { ...input, ...updateAudit() }),
    'categories.update',
  );
}

export function deleteCategory(bid: string, categoryId: string): void {
  trackWrite(deleteDoc(doc(categoriesCol(bid), categoryId)), 'categories.delete');
}
