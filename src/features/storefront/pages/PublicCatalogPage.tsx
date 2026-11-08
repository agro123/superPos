import { MessageCircle, Store } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { normalizeSearch } from '@/shared/lib/text';
import { Button, EmptyState, SearchBar, Select, Skeleton } from '@/shared/ui';
import { usePublicCatalog, usePublicItems } from '../application/useStorefront';
import { orderTotal } from '../domain/order';
import { OrderDialog } from '../ui/OrderDialog';
import { PublicProductCard } from '../ui/PublicProductCard';

/** Catálogo público (sin sesión): productos que el dueño publicó y pedido por WhatsApp. */
export default function PublicCatalogPage() {
  const { slug = '' } = useParams();
  const catalog = usePublicCatalog(slug);
  const header = catalog.data?.value ?? null;
  const items = usePublicItems(slug, header?.enabled === true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [ordering, setOrdering] = useState(false);

  if (catalog.isPending || (header?.enabled && items.isPending)) {
    return <Skeleton className="m-4 h-96" />;
  }
  if (!header?.enabled || catalog.isError) {
    return (
      <main id="main-content" className="flex min-h-dvh items-center justify-center bg-bg p-4">
        <EmptyState
          icon={<Store />}
          title={t('storefront.unavailable')}
          description={t('storefront.unavailableHint')}
        />
      </main>
    );
  }

  const all = [...(items.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = [...new Set(all.flatMap((i) => (i.categoryName ? [i.categoryName] : [])))];
  const needle = normalizeSearch(search);
  const shown = all.filter(
    (i) =>
      (category === 'all' || i.categoryName === category) &&
      (!needle || normalizeSearch(i.name).includes(needle)),
  );
  const lines = all.flatMap((i) => {
    const quantity = cart[i.id] ?? 0;
    return quantity > 0 ? [{ name: i.name, quantity, priceMinor: i.priceMinor }] : [];
  });
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const canOrder = header.whatsapp !== null;

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="border-b border-border bg-surface px-4 py-5">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold text-text">{header.title}</h1>
          {header.description ? (
            <p className="mt-1 text-sm text-text-muted">{header.description}</p>
          ) : null}
        </div>
      </header>
      <main id="main-content" className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBar
            value={search}
            onValueChange={setSearch}
            label={t('storefront.search')}
            placeholder={t('storefront.search')}
            className="flex-1"
          />
          {categories.length > 0 ? (
            <Select
              aria-label={t('pos.categories')}
              className="sm:w-56"
              value={category}
              onValueChange={setCategory}
              options={[
                { value: 'all', label: t('pos.allCategories') },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          ) : null}
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={<Store />} title={t('pos.noProducts')} />
        ) : (
          <ul
            aria-label={t('pos.products')}
            className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3"
          >
            {shown.map((item) => (
              <li key={item.id}>
                <PublicProductCard
                  item={item}
                  currency={header.currency}
                  quantity={cart[item.id] ?? 0}
                  canOrder={canOrder}
                  onQuantityChange={(quantity) => {
                    setCart({ ...cart, [item.id]: quantity });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
      {canOrder && count > 0 ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface p-3">
          <Button
            size="lg"
            fullWidth
            leftIcon={<MessageCircle aria-hidden className="size-5" />}
            onClick={() => {
              setOrdering(true);
            }}
          >
            {t('storefront.orderCta', {
              count: formatNumber(count),
              amount: formatMoney(orderTotal(lines), header.currency),
            })}
          </Button>
        </div>
      ) : null}
      {header.whatsapp ? (
        <OrderDialog
          open={ordering}
          onOpenChange={setOrdering}
          storeName={header.title}
          whatsapp={header.whatsapp}
          lines={lines}
          currency={header.currency}
        />
      ) : null}
    </div>
  );
}
