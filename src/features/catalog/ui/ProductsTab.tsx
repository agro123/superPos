import { Package, Plus } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { useCurrentUser } from '@/features/auth';
import { useToast } from '@/shared/hooks/useToast';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import type { Synced } from '@/shared/domain/live';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, DataTable, Drawer, EmptyState, type DataTableColumn } from '@/shared/ui';
import { catalogWrites, useCategories, useProducts } from '../application/useCatalog';
import type { Product, ValidProductInput } from '../domain/product';
import { stockLevelOf } from '../domain/stockLevel';
import { ProductForm } from './ProductForm';

type Editing = { mode: 'create' } | { mode: 'edit'; product: Product } | null;

export function ProductsTab() {
  const { business, taxes } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const online = useOnlineStatus();
  const products = useProducts(business.id);
  const categories = useCategories(business.id);
  const [editing, setEditing] = useState<Editing>(null);
  const categoryName = (id: string | null) =>
    categories.data?.find((c) => c.id === id)?.name ?? t('catalog.noCategory');

  const save = (input: ValidProductInput, image: File | null) => {
    let productId: string;
    if (editing?.mode === 'edit') {
      productId = editing.product.id;
      catalogWrites.updateProduct(business.id, productId, input);
    } else {
      productId = catalogWrites.createProduct(business.id, input, user.uid);
    }
    if (image) catalogWrites.queueProductImage({ businessId: business.id, productId, image });
    toast({
      title: online ? t('common.saved') : t('common.savedOffline'),
      description: image ? t('catalog.imageQueued') : undefined,
      tone: 'success',
    });
    setEditing(null);
  };

  const columns: DataTableColumn<Synced<Product>>[] = [
    {
      id: 'name',
      header: t('common.name'),
      sortValue: (p) => p.name,
      cell: (p) => (
        <span className="flex flex-col">
          <span>{p.name}</span>
          {p.pendingSync ? <Badge className="self-start">{t('common.pendingSync')}</Badge> : null}
        </span>
      ),
    },
    {
      id: 'category',
      header: t('catalog.col.category'),
      cell: (p) => categoryName(p.categoryId),
      sortValue: (p) => categoryName(p.categoryId),
      hideOnMobile: true,
    },
    {
      id: 'price',
      header: t('catalog.col.price'),
      align: 'right',
      sortValue: (p) => p.priceMinor,
      cell: (p) => formatMoney(p.priceMinor, business.currency),
    },
    {
      id: 'stock',
      header: t('catalog.col.stock'),
      align: 'right',
      sortValue: (p) => (p.trackStock ? p.stock : Number.POSITIVE_INFINITY),
      cell: (p) => {
        const level = stockLevelOf(p);
        if (level === 'untracked') return '—';
        const tone = level === 'out' ? 'danger' : level === 'low' ? 'warning' : 'neutral';
        return <Badge tone={tone}>{formatNumber(p.stock)}</Badge>;
      },
    },
    {
      id: 'status',
      header: t('common.status'),
      hideOnMobile: true,
      cell: (p) => (
        <Badge tone={p.active ? 'success' : 'neutral'}>
          {p.active ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
  ];

  if (products.isError) {
    return (
      <EmptyState
        tone="danger"
        title={t('common.loadError')}
        description={errorMessage(products.error)}
        action={<Button onClick={() => void products.refetch()}>{t('common.retry')}</Button>}
      />
    );
  }

  return (
    <>
      <DataTable
        caption={t('catalog.productsTable')}
        columns={columns}
        rows={products.data ?? []}
        getRowId={(p) => p.id}
        loading={products.isPending}
        searchText={(p) => `${p.name} ${p.sku ?? ''} ${p.barcode ?? ''}`}
        searchPlaceholder={t('catalog.search')}
        onRowClick={(product) => {
          setEditing({ mode: 'edit', product });
        }}
        toolbar={
          <Button
            className="sm:ml-auto"
            leftIcon={<Plus aria-hidden className="size-5" />}
            onClick={() => {
              setEditing({ mode: 'create' });
            }}
          >
            {t('catalog.newProduct')}
          </Button>
        }
        emptyState={
          <EmptyState
            icon={<Package />}
            title={t('catalog.empty')}
            description={t('catalog.emptyHint')}
          />
        }
      />
      <Drawer
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={editing?.mode === 'edit' ? t('catalog.editProduct') : t('catalog.newProduct')}
        footer={
          <Button type="submit" form="product-form" size="lg" fullWidth>
            {t('common.save')}
          </Button>
        }
      >
        {editing ? (
          <ProductForm
            key={editing.mode === 'edit' ? editing.product.id : 'new'}
            product={editing.mode === 'edit' ? editing.product : null}
            categories={categories.data ?? []}
            taxRates={taxes.rates}
            defaultTaxRateBps={taxes.defaultRateBps}
            currency={business.currency}
            onSubmit={save}
          />
        ) : null}
      </Drawer>
    </>
  );
}
