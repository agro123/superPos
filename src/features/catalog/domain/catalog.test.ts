import { describe, expect, it } from 'vitest';
import { categorySchema, sortCategories, type Category } from './category';
import { findByBarcode, productInputSchema, productSchema, type Product } from './product';

const audit = { createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', schemaVersion: 1 };

const product = (overrides: Partial<Product> = {}): Product =>
  productSchema.parse({
    id: 'p1',
    name: 'Café',
    sku: null,
    barcode: '7701',
    categoryId: null,
    priceMinor: 350000,
    costMinor: null,
    taxRateBps: 1900,
    trackStock: true,
    lowStockThreshold: 5,
    active: true,
    stock: 10,
    imageUrl: null,
    ...audit,
    ...overrides,
  });

describe('product', () => {
  it('rechaza precios decimales o negativos (L10)', () => {
    const input = {
      name: 'X',
      sku: '',
      barcode: null,
      categoryId: null,
      costMinor: null,
      taxRateBps: 0,
      trackStock: false,
      lowStockThreshold: 0,
      active: true,
      initialStock: 0,
    };
    expect(productInputSchema.safeParse({ ...input, priceMinor: 10.5 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...input, priceMinor: -1 }).success).toBe(false);
    expect(productInputSchema.parse({ ...input, priceMinor: 100 }).sku).toBeNull();
  });

  it('busca por código de barras solo entre activos', () => {
    const products = [product(), product({ id: 'p2', barcode: '7702', active: false })];
    expect(findByBarcode(products, ' 7701 ')?.id).toBe('p1');
    expect(findByBarcode(products, '7702')).toBeUndefined();
    expect(findByBarcode(products, '')).toBeUndefined();
  });
});

describe('category', () => {
  it('ordena por sortOrder y luego por nombre', () => {
    const make = (id: string, name: string, sortOrder: number): Category =>
      categorySchema.parse({ id, name, color: 'primary', sortOrder, ...audit });
    const sorted = sortCategories([
      make('a', 'Postres', 1),
      make('b', 'Bebidas', 1),
      make('c', 'Café', 0),
    ]);
    expect(sorted.map((c) => c.name)).toEqual(['Café', 'Bebidas', 'Postres']);
  });
});
