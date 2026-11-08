import { useState } from 'react';
import { Link } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { presetFor, useActiveBusiness } from '@/features/business';
import { catalogWrites, ProductImportPanel, useCategories, useProducts } from '@/features/catalog';
import { fromMajorUnits, type Money } from '@/shared/domain/money';
import { useToast } from '@/shared/hooks/useToast';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, Checkbox, MoneyInput, Skeleton, Text } from '@/shared/ui';

const norm = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** Tres caminos para cargar productos: ejemplos del tipo de negocio, archivo o uno a uno. */
export function ProductsStep() {
  const { business, taxes } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const products = useProducts(business.id);
  const categories = useCategories(business.id);
  const preset = presetFor(business.type);
  const existing = new Set((products.data ?? []).map((p) => norm(p.name)));
  const samples = preset.sampleProducts.filter((p) => !existing.has(norm(p.name)));
  const [prices, setPrices] = useState<Record<string, Money | null>>(() =>
    Object.fromEntries(
      preset.sampleProducts.map((p) => [p.name, fromMajorUnits(p.price, business.currency)]),
    ),
  );
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(samples.map((p) => p.name)),
  );
  if (products.isPending || categories.isPending) return <Skeleton className="h-48" />;

  const chosen = samples.filter((p) => selected.has(p.name) && (prices[p.name] ?? null) !== null);
  const create = () => {
    const known = new Set((categories.data ?? []).map((c) => norm(c.name)));
    const newCategories = [...new Set(chosen.map((p) => p.category))].filter(
      (name) => !known.has(norm(name)),
    );
    const count = catalogWrites.importProducts(
      business.id,
      {
        products: chosen.map((p) => ({
          categoryName: p.category,
          input: {
            name: p.name,
            sku: null,
            barcode: null,
            categoryId: null,
            priceMinor: prices[p.name] ?? fromMajorUnits(p.price, business.currency),
            costMinor: null,
            taxRateBps: taxes.defaultRateBps,
            trackStock: p.trackStock,
            lowStockThreshold: p.trackStock ? 3 : 0,
            active: true,
            initialStock: p.stock,
          },
        })),
        newCategories,
        categories: categories.data ?? [],
      },
      user.uid,
    );
    toast({ title: t('import.done', { count: formatNumber(count) }), tone: 'success' });
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="samples" className="flex flex-col gap-3">
        <h3 id="samples" className="text-base font-semibold text-text">
          {t('setup.products.samples')}
        </h3>
        {samples.length === 0 ? (
          <Text variant="strong">
            {t('setup.products.allCreated', { count: formatNumber(products.data?.length ?? 0) })}
          </Text>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
              {samples.map((p) => (
                <li
                  key={p.name}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="flex items-center gap-3">
                    <Checkbox
                      id={`sample-${p.name}`}
                      checked={selected.has(p.name)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selected);
                        if (checked) next.add(p.name);
                        else next.delete(p.name);
                        setSelected(next);
                      }}
                    />
                    <label htmlFor={`sample-${p.name}`} className="text-sm text-text">
                      {p.name} <span className="text-text-muted">· {p.category}</span>
                    </label>
                  </span>
                  <MoneyInput
                    aria-label={t('setup.products.price', { name: p.name })}
                    className="w-36"
                    currency={business.currency}
                    value={prices[p.name] ?? null}
                    onValueChange={(value) => {
                      setPrices({ ...prices, [p.name]: value });
                    }}
                  />
                </li>
              ))}
            </ul>
            <Button className="self-start" disabled={chosen.length === 0} onClick={create}>
              {t('setup.products.create', { count: formatNumber(chosen.length) })}
            </Button>
          </>
        )}
      </section>
      <details className="rounded-md border border-border p-3">
        <summary className="min-h-touch cursor-pointer content-center text-sm font-medium text-text">
          {t('setup.products.fromFile')}
        </summary>
        <div className="pt-3">
          <ProductImportPanel />
        </div>
      </details>
      <Text variant="caption">
        {t('setup.products.manual')}{' '}
        <Link to="/catalog" className="font-medium text-primary hover:underline">
          {t('nav.catalog')}
        </Link>
      </Text>
    </div>
  );
}
