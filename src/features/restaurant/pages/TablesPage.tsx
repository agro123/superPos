import { LayoutGrid, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { Can } from '@/features/users';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState, PageHeader, Skeleton } from '@/shared/ui';
import { useActiveOrders, useTables, useZones } from '../application/useRestaurant';
import { ManageTablesDialog } from '../ui/ManageTablesDialog';
import { TableCard } from '../ui/TableCard';

/** Tablero de mesas por zona, en tiempo real: estado, comensales, tiempo y total. */
export default function TablesPage() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const zones = useZones(business.id);
  const tables = useTables(business.id);
  const orders = useActiveOrders(business.id);
  const [managing, setManaging] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  const loading = zones.isPending || tables.isPending || orders.isPending;
  const error = zones.error ?? tables.error ?? orders.error;
  const orderFor = (tableId: string) => orders.data?.find((o) => o.tableId === tableId) ?? null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('restaurant.title')}
        description={t('restaurant.description')}
        actions={
          <Can permission="settings.manage">
            <Button
              variant="outline"
              leftIcon={<Settings2 aria-hidden className="size-5" />}
              onClick={() => {
                setManaging(true);
              }}
            >
              {t('restaurant.manage')}
            </Button>
          </Can>
        }
      />
      {error ? (
        <EmptyState tone="danger" title={t('common.loadError')} description={errorMessage(error)} />
      ) : loading ? (
        <Skeleton className="h-64" />
      ) : (tables.data ?? []).length === 0 ? (
        <EmptyState
          icon={<LayoutGrid />}
          title={t('restaurant.empty')}
          description={t('restaurant.emptyHint')}
        />
      ) : (
        (zones.data ?? []).map((zone) => {
          const zoneTables = (tables.data ?? []).filter((table) => table.zoneId === zone.id);
          if (zoneTables.length === 0) return null;
          return (
            <section
              key={zone.id}
              aria-labelledby={`zone-${zone.id}`}
              className="flex flex-col gap-3"
            >
              <h2 id={`zone-${zone.id}`} className="text-lg font-semibold text-text">
                {zone.name}
              </h2>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
                {zoneTables.map((table) => (
                  <li key={table.id}>
                    <TableCard
                      table={table}
                      order={orderFor(table.id)}
                      currency={business.currency}
                      now={now}
                      onOpen={() => void navigate(`/restaurant/tables/${table.id}`)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
      <ManageTablesDialog
        open={managing}
        onOpenChange={setManaging}
        businessId={business.id}
        uid={user.uid}
        zones={zones.data ?? []}
        tables={tables.data ?? []}
      />
    </div>
  );
}
