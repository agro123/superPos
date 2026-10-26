import { PackageSearch } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { sortCategories, stockLevelOf, type Category, type Product } from '@/features/catalog';
import { useHotkey } from '@/shared/hooks/useHotkey';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { normalizeSearch } from '@/shared/lib/text';
import { EmptyState, ProductGrid, SearchBar, Text, type ProductGridItem } from '@/shared/ui';
import { CategoryChips } from './CategoryChips';

export interface PosCatalogProps {
  products: readonly Product[];
  categories: readonly Category[];
  loading: boolean;
  currency: CurrencyCode;
  onAdd: (product: Product) => void;
  /** Enter en el buscador: código de barras exacto o único resultado. */
  onSubmitSearch: (text: string, visible: readonly Product[]) => void;
}

export function PosCatalog({
  products,
  categories,
  loading,
  currency,
  onAdd,
  onSubmitSearch,
}: PosCatalogProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useHotkey('F2', () => searchRef.current?.focus());

  const visible = useMemo(() => {
    const needle = normalizeSearch(search);
    return products.filter(
      (p) =>
        p.active &&
        (category === null || p.categoryId === category) &&
        (!needle ||
          normalizeSearch(`${p.name} ${p.sku ?? ''} ${p.barcode ?? ''}`).includes(needle)),
    );
  }, [products, search, category]);

  const items: ProductGridItem[] = visible.map((p) => ({
    id: p.id,
    name: p.name,
    priceLabel: formatMoney(p.priceMinor, currency),
    imageUrl: p.imageUrl,
    badge:
      stockLevelOf(p) === 'out' ? { label: t('ui.product.outOfStock'), tone: 'danger' } : undefined,
    disabled: stockLevelOf(p) === 'out',
  }));

  return (
    <>
      <SearchBar
        ref={searchRef}
        value={search}
        onValueChange={setSearch}
        onSubmit={(text) => {
          onSubmitSearch(text, visible);
          setSearch('');
        }}
        label={t('pos.search')}
        placeholder={t('pos.search')}
        shortcut="F2"
      />
      <CategoryChips
        categories={sortCategories(categories)}
        selected={category}
        onSelect={setCategory}
      />
      <ProductGrid
        label={t('pos.products')}
        items={items}
        loading={loading}
        onSelect={(id) => {
          const product = visible.find((p) => p.id === id);
          if (product) onAdd(product);
        }}
        emptyState={
          <EmptyState
            icon={<PackageSearch />}
            title={t('pos.noProducts')}
            description={t('pos.noProductsHint')}
          />
        }
      />
      <Text variant="caption" className="hidden md:block">
        {t('pos.shortcuts')}
      </Text>
    </>
  );
}
