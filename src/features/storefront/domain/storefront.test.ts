import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { deliveryOrderMessage, orderTotal, shareCatalogText } from './order';
import { buildPublicItems, diffPublicItems, suggestSlug, type PublicItem } from './storefront';

const product = (
  id: string,
  overrides: Partial<Parameters<typeof buildPublicItems>[0][number]> = {},
) => ({
  id,
  name: id.toUpperCase(),
  priceMinor: money(1000),
  imageUrl: null,
  categoryId: 'c1',
  active: true,
  trackStock: true,
  stock: 5,
  ...overrides,
});

describe('catálogo público', () => {
  it('sugiere un slug válido', () => {
    expect(suggestSlug('Tienda Doña Rosa')).toBe('tienda-dona-rosa');
    expect(suggestSlug('A')).toBe('tienda-a');
  });

  it('publica solo productos activos y visibles; agotados según la configuración', () => {
    const products = [
      product('a'),
      product('b', { stock: 0 }),
      product('c', { active: false }),
      product('d'),
      product('e', { trackStock: false, stock: 0 }),
    ];
    const settings = { visibleProductIds: ['a', 'b', 'c', 'e'], showOutOfStock: false };
    const items = buildPublicItems(products, [{ id: 'c1', name: 'Despensa' }], settings);
    expect([...items.keys()]).toEqual(['a', 'e']);
    expect(items.get('a')).toMatchObject({ categoryName: 'Despensa', available: true });
    const withOut = buildPublicItems(products, [], { ...settings, showOutOfStock: true });
    expect(withOut.get('b')?.available).toBe(false);
  });

  it('calcula solo los cambios a publicar', () => {
    const desired = buildPublicItems([product('a'), product('b')], [], {
      visibleProductIds: ['a', 'b'],
      showOutOfStock: false,
    });
    const audit = {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'u',
      schemaVersion: 1,
    };
    const published: PublicItem[] = [
      {
        id: 'a',
        ...(desired.get('a') ?? {
          name: '',
          priceMinor: money(0),
          imageUrl: null,
          categoryName: null,
          available: true,
          sortOrder: 0,
        }),
        ...audit,
      },
      {
        id: 'viejo',
        name: 'X',
        priceMinor: money(1),
        imageUrl: null,
        categoryName: null,
        available: true,
        sortOrder: 9,
        ...audit,
      },
    ];
    const diff = diffPublicItems(desired, published);
    expect(diff.upserts.map(([id]) => id)).toEqual(['b']);
    expect(diff.deletes).toEqual(['viejo']);
  });
});

describe('pedido por WhatsApp', () => {
  const lines = [
    { name: 'Arroz', quantity: 2, priceMinor: money(320000) },
    { name: 'Leche', quantity: 1, priceMinor: money(450000) },
  ];
  const fmt = (amount: number) => `$${String(amount / 100)}`;

  it('arma el mensaje con productos, total y datos de entrega', () => {
    expect(orderTotal(lines)).toBe(1090000);
    const text = deliveryOrderMessage(
      'Tienda Rosa',
      lines,
      { name: 'Ana', address: 'Cra 1 # 2-3', notes: '' },
      fmt,
    );
    expect(text).toContain('• 2 × Arroz ($6400)');
    expect(text).toContain('Total aproximado: $10900');
    expect(text).toContain('Dirección: Cra 1 # 2-3');
    expect(text).not.toContain('Notas:');
  });

  it('texto para compartir el catálogo', () => {
    expect(shareCatalogText('Tienda', 'https://x.co/c/t', ['Arroz'])).toContain('https://x.co/c/t');
  });
});
