import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { stockLevelOf, useProducts, type Product } from '@/features/catalog';
import { useEmailPreference } from '@/features/storefront';
import { useMembers } from '@/features/users';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState, PageHeader, StatCard, Tabs } from '@/shared/ui';
import { useMovements, useSuppliers } from '../application/useInventory';
import type { StockChangeMode } from '../domain/stockChange';
import { MovementsTab } from '../ui/MovementsTab';
import { ReorderTab } from '../ui/ReorderTab';
import { StockChangeDialog } from '../ui/StockChangeDialog';
import { StockTab } from '../ui/StockTab';
import { SuppliersTab } from '../ui/SuppliersTab';

/** Inventario: existencias y alertas, reabastecimiento, bitácora y proveedores. */
export default function InventoryPage() {
  const { business } = useActiveBusiness();
  const toast = useToast();
  const online = useOnlineStatus();
  const products = useProducts(business.id);
  const suppliers = useSuppliers(business.id);
  const movements = useMovements(business.id);
  const members = useMembers(business.id);
  const email = useEmailPreference(business.id);
  const [target, setTarget] = useState<{ product: Product; mode: StockChangeMode } | null>(null);
  const tracked = (products.data ?? []).filter((p) => p.trackStock && p.active);
  const count = (level: 'low' | 'out') => tracked.filter((p) => stockLevelOf(p) === level).length;
  const workerName = (uid: string) => members.data?.find((m) => m.id === uid)?.displayName ?? '—';

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
        <Tabs
          label={t('inventory.sections')}
          items={[
            {
              value: 'stock',
              label: t('inventory.tab.stock'),
              content: (
                <StockTab
                  products={tracked}
                  loading={products.isPending}
                  onChange={(product, mode) => {
                    setTarget({ product, mode });
                  }}
                />
              ),
            },
            {
              value: 'reorder',
              label: t('inventory.tab.reorder'),
              content: (
                <ReorderTab
                  businessId={business.id}
                  businessName={business.name}
                  suppliers={suppliers.data ?? []}
                  email={email}
                />
              ),
            },
            {
              value: 'movements',
              label: t('inventory.tab.movements'),
              content: (
                <MovementsTab
                  movements={movements.data ?? []}
                  loading={movements.isPending}
                  products={products.data ?? []}
                  suppliers={suppliers.data ?? []}
                  workerName={workerName}
                  timezone={business.timezone}
                />
              ),
            },
            {
              value: 'suppliers',
              label: t('inventory.tab.suppliers'),
              content: (
                <SuppliersTab
                  businessId={business.id}
                  suppliers={suppliers.data ?? []}
                  loading={suppliers.isPending}
                />
              ),
            },
          ]}
        />
      )}
      <StockChangeDialog
        businessId={business.id}
        target={target}
        suppliers={suppliers.data ?? []}
        onClose={() => {
          setTarget(null);
        }}
        onSaved={() => {
          toast({ title: online ? t('common.saved') : t('common.savedOffline'), tone: 'success' });
        }}
      />
    </div>
  );
}
