import { Boxes } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { stockLevelOf, useProducts, type Product, type StockLevel } from '@/features/catalog';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  PageHeader,
  StatCard,
  Switch,
  type BadgeTone,
  type DataTableColumn,
} from '@/shared/ui';

const LEVEL_TONE: Record<StockLevel, BadgeTone> = {
  ok: 'success',
  low: 'warning',
  out: 'danger',
  untracked: 'neutral',
};
const LEVEL_ORDER: Record<StockLevel, number> = { out: 0, low: 1, ok: 2, untracked: 3 };

/** Inventario de solo lectura con alertas de stock bajo. */
export default function InventoryPage() {
  const { business } = useActiveBusiness();
  const products = useProducts(business.id);
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const tracked = (products.data ?? []).filter((p) => p.trackStock && p.active);
  const count = (level: StockLevel) => tracked.filter((p) => stockLevelOf(p) === level).length;
  const rows = onlyAlerts
    ? tracked.filter((p) => ['low', 'out'].includes(stockLevelOf(p)))
    : tracked;

  const columns: DataTableColumn<Product>[] = [
    { id: 'name', header: t('common.name'), cell: (p) => p.name, sortValue: (p) => p.name },
    {
      id: 'stock',
      header: t('catalog.col.stock'),
      align: 'right',
      cell: (p) => formatNumber(p.stock),
      sortValue: (p) => p.stock,
    },
    {
      id: 'threshold',
      header: t('inventory.threshold'),
      align: 'right',
      hideOnMobile: true,
      cell: (p) => formatNumber(p.lowStockThreshold),
    },
    {
      id: 'level',
      header: t('common.status'),
      sortValue: (p) => LEVEL_ORDER[stockLevelOf(p)],
      cell: (p) => (
        <Badge tone={LEVEL_TONE[stockLevelOf(p)]}>{t(`inventory.level.${stockLevelOf(p)}`)}</Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t('inventory.title')} description={t('inventory.description')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t('inventory.tracked')}
          value={formatNumber(tracked.length)}
          loading={products.isPending}
        />
        <StatCard
          label={t('inventory.low')}
          value={formatNumber(count('low'))}
          loading={products.isPending}
        />
        <StatCard
          label={t('inventory.out')}
          value={formatNumber(count('out'))}
          loading={products.isPending}
        />
      </div>
      {products.isError ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(products.error)}
          action={<Button onClick={() => void products.refetch()}>{t('common.retry')}</Button>}
        />
      ) : (
        <DataTable
          caption={t('inventory.table')}
          columns={columns}
          rows={rows}
          getRowId={(p) => p.id}
          loading={products.isPending}
          searchText={(p) => p.name}
          searchPlaceholder={t('inventory.search')}
          toolbar={
            <div className="flex items-center gap-2 sm:ml-auto">
              <Switch id="only-alerts" checked={onlyAlerts} onCheckedChange={setOnlyAlerts} />
              <label htmlFor="only-alerts" className="text-sm text-text">
                {t('inventory.onlyAlerts')}
              </label>
            </div>
          }
          emptyState={
            <EmptyState
              icon={<Boxes />}
              title={onlyAlerts ? t('inventory.noAlerts') : t('inventory.empty')}
              description={onlyAlerts ? undefined : t('inventory.emptyHint')}
            />
          }
        />
      )}
    </div>
  );
}
