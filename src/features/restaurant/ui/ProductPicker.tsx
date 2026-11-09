import { useState } from 'react';
import type { Product } from '@/features/catalog';
import type { CurrencyCode } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { normalizeSearch } from '@/shared/lib/text';
import { SearchBar } from '@/shared/ui';

export interface ProductPickerProps {
  products: readonly Product[];
  currency: CurrencyCode;
  onPick: (product: Product) => void;
}

/** Buscador táctil de productos para tomar el pedido de la mesa. */
export function ProductPicker({ products, currency, onPick }: ProductPickerProps) {
  const [search, setSearch] = useState('');
  const needle = normalizeSearch(search);
  const shown = products.filter(
    (p) => p.active && (!needle || normalizeSearch(p.name).includes(needle)),
  );
  return (
    <div className="flex flex-col gap-3">
      <SearchBar
        value={search}
        onValueChange={setSearch}
        label={t('pos.search')}
        placeholder={t('pos.search')}
      />
      <ul
        aria-label={t('pos.products')}
        className="grid max-h-[28rem] grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2 overflow-y-auto"
      >
        {shown.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => {
                onPick(p);
              }}
              className="flex min-h-touch w-full flex-col rounded-md border border-border bg-surface p-2 text-left text-sm hover:bg-surface-muted"
            >
              <span className="line-clamp-2 font-medium text-text">{p.name}</span>
              <span className="text-text-muted tabular-nums">
                {formatMoney(p.priceMinor, currency)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
