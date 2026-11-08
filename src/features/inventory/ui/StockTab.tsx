import { Boxes } from 'lucide-react';
import { useState } from 'react';
import { stockLevelOf, type Product, type StockLevel } from '@/features/catalog';
import { Can } from '@/features/users';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Switch,
  type BadgeTone,
  type DataTableColumn,
} from '@/shared/ui';
import type { StockChangeMode } from '../domain/stockChange';

const LEVEL_TONE: Record<StockLevel, BadgeTone> = {
  ok: 'success',
  low: 'warning',
  out: 'danger',
  untracked: 'neutral',
};
const LEVEL_ORDER: Record<StockLevel, number> = { out: 0, low: 1, ok: 2, untracked: 3 };

export interface StockTabProps {
  products: readonly Product[];
  loading: boolean;
  onChange: (product: Product, mode: StockChangeMode) => void;
}

/** Existencias con alertas y acciones de entrada/ajuste (`inventory.adjust`). */
export function StockTab({ products, loading, onChange }: StockTabProps) {
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const rows = onlyAlerts
    ? products.filter((p) => ['low', 'out'].includes(stockLevelOf(p)))
    : products;
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
    {
      id: 'actions',
      header: t('common.actions'),
      align: 'right',
      cell: (p) => (
        <Can permission="inventory.adjust">
          <span className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onChange(p, 'purchase');
              }}
            >
              {t('inventory.purchase')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange(p, 'adjustment');
              }}
            >
              {t('inventory.adjust')}
            </Button>
          </span>
        </Can>
      ),
    },
  ];
  return (
    <DataTable
      caption={t('inventory.table')}
      columns={columns}
      rows={rows}
      getRowId={(p) => p.id}
      loading={loading}
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
  );
}
