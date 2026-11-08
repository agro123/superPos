import { History } from 'lucide-react';
import type { Product } from '@/features/catalog';
import type { Synced } from '@/shared/domain/live';
import { formatDateTime, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, DataTable, EmptyState, type DataTableColumn } from '@/shared/ui';
import type { InventoryMovement, Supplier } from '../domain/stock';

export interface MovementsTabProps {
  movements: readonly Synced<InventoryMovement>[];
  loading: boolean;
  products: readonly Product[];
  suppliers: readonly Supplier[];
  workerName: (uid: string) => string;
  timezone: string;
}

const TONES = {
  sale: 'neutral',
  void: 'warning',
  adjustment: 'info',
  purchase: 'success',
} as const;

/** Bitácora de inventario (inmutable): ventas, anulaciones, compras y ajustes, con quién. */
export function MovementsTab({
  movements,
  loading,
  products,
  suppliers,
  workerName,
  timezone,
}: MovementsTabProps) {
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? '—';
  const columns: DataTableColumn<Synced<InventoryMovement>>[] = [
    {
      id: 'date',
      header: t('common.date'),
      cell: (m) => formatDateTime(m.createdAt, timezone),
      sortValue: (m) => m.createdAt.getTime(),
    },
    { id: 'product', header: t('inventory.product'), cell: (m) => name(m.productId) },
    {
      id: 'type',
      header: t('inventory.movementType'),
      cell: (m) => <Badge tone={TONES[m.type]}>{t(`inventory.type.${m.type}`)}</Badge>,
    },
    {
      id: 'delta',
      header: t('inventory.delta'),
      align: 'right',
      cell: (m) => `${m.quantityDelta > 0 ? '+' : ''}${formatNumber(m.quantityDelta)}`,
    },
    {
      id: 'detail',
      header: t('inventory.detail'),
      hideOnMobile: true,
      cell: (m) =>
        [m.supplierId ? suppliers.find((s) => s.id === m.supplierId)?.name : null, m.reason]
          .filter(Boolean)
          .join(' · ') || '—',
    },
    {
      id: 'worker',
      header: t('cash.col.worker'),
      hideOnMobile: true,
      cell: (m) => workerName(m.createdBy),
    },
  ];
  return (
    <DataTable
      caption={t('inventory.movements')}
      columns={columns}
      rows={movements}
      getRowId={(m) => m.id}
      loading={loading}
      searchText={(m) => name(m.productId)}
      searchPlaceholder={t('inventory.search')}
      emptyState={<EmptyState icon={<History />} title={t('inventory.noMovements')} />}
    />
  );
}
