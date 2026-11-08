import { useState } from 'react';
import type { CurrencyCode, Money } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { normalizeSearch } from '@/shared/lib/text';
import { Badge, Button, SearchBar, Switch } from '@/shared/ui';

export interface VisibilityProduct {
  id: string;
  name: string;
  priceMinor: Money;
  outOfStock: boolean;
}

export interface ProductVisibilityListProps {
  products: readonly VisibilityProduct[];
  visible: ReadonlySet<string>;
  currency: CurrencyCode;
  onChange: (visible: Set<string>) => void;
}

/** El dueño elige qué productos se ven en el catálogo público. */
export function ProductVisibilityList({
  products,
  visible,
  currency,
  onChange,
}: ProductVisibilityListProps) {
  const [search, setSearch] = useState('');
  const needle = normalizeSearch(search);
  const shown = products.filter((p) => !needle || normalizeSearch(p.name).includes(needle));
  const toggle = (id: string, on: boolean) => {
    const next = new Set(visible);
    if (on) next.add(id);
    else next.delete(id);
    onChange(next);
  };
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-text">
        {t('storefront.products', { count: String(visible.size), total: String(products.length) })}
      </legend>
      <div className="flex flex-wrap gap-2">
        <SearchBar
          value={search}
          onValueChange={setSearch}
          label={t('storefront.searchProducts')}
          placeholder={t('storefront.searchProducts')}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onChange(new Set([...visible, ...shown.map((p) => p.id)]));
          }}
        >
          {t('storefront.showAll')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(new Set([...visible].filter((id) => !shown.some((p) => p.id === id))));
          }}
        >
          {t('storefront.hideAll')}
        </Button>
      </div>
      <ul className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
        {shown.map((p) => (
          <li key={p.id}>
            <div className="flex min-h-touch items-center justify-between gap-3 px-3 py-2">
              <span className="flex flex-col">
                <label
                  htmlFor={`visible-${p.id}`}
                  className="cursor-pointer text-sm font-medium text-text"
                >
                  {p.name}
                </label>
                <span className="flex items-center gap-2 text-xs text-text-muted">
                  {formatMoney(p.priceMinor, currency)}
                  {p.outOfStock ? <Badge tone="danger">{t('ui.product.outOfStock')}</Badge> : null}
                </span>
              </span>
              <Switch
                checked={visible.has(p.id)}
                onCheckedChange={(on) => {
                  toggle(p.id, on);
                }}
                aria-label={t('storefront.toggleProduct', { name: p.name })}
              />
            </div>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
