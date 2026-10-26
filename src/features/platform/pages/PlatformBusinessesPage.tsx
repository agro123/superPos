import { Building2, Crown, Ban, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { BUSINESS_STATUSES, type Business } from '@/features/business';
import type { Synced } from '@/shared/domain/live';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatDateTime, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  Button,
  DataTable,
  Drawer,
  EmptyState,
  PageHeader,
  Select,
  StatCard,
  type DataTableColumn,
} from '@/shared/ui';
import { useCreatePlatformBusiness, usePlatformBusinesses } from '../application/usePlatform';
import { filterByStatus, summarize, type StatusFilter } from '../domain/platformBusiness';
import { PlanBadge } from '../ui/PlanBadge';
import { PlatformBusinessForm } from '../ui/PlatformBusinessForm';
import { StatusBadge } from '../ui/StatusBadge';

const STATUS_FILTERS: readonly StatusFilter[] = ['all', ...BUSINESS_STATUSES];

/** Panel del super admin: todos los negocios de la plataforma. */
export default function PlatformBusinessesPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const online = useOnlineStatus();
  const businesses = usePlatformBusinesses();
  const create = useCreatePlatformBusiness();
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<StatusFilter>('all');

  const all = businesses.data ?? [];
  const summary = summarize(all);
  const rows = filterByStatus(all, status);

  const columns: DataTableColumn<Synced<Business>>[] = [
    {
      id: 'name',
      header: t('common.name'),
      sortValue: (b) => b.name,
      cell: (b) => (
        <span className="flex flex-col">
          {b.name}
          <span className="text-xs text-text-subtle">{t(`businessType.${b.type}`)}</span>
        </span>
      ),
    },
    {
      id: 'plan',
      header: t('platform.plan'),
      sortValue: (b) => b.plan,
      cell: (b) => <PlanBadge plan={b.plan} />,
    },
    {
      id: 'status',
      header: t('common.status'),
      sortValue: (b) => b.status,
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      id: 'createdAt',
      header: t('platform.createdAt'),
      sortValue: (b) => b.createdAt.getTime(),
      cell: (b) => formatDateTime(b.createdAt, b.timezone),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('platform.title')}
        description={t('platform.description')}
        actions={
          <Button
            leftIcon={<Plus aria-hidden className="size-5" />}
            onClick={() => {
              create.reset();
              setCreating(true);
            }}
          >
            {t('platform.new')}
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t('platform.summary.total')}
          value={formatNumber(summary.total)}
          icon={<Building2 />}
          loading={businesses.isPending}
        />
        <StatCard
          label={t('platform.summary.premium')}
          value={formatNumber(summary.premium)}
          icon={<Crown />}
          loading={businesses.isPending}
        />
        <StatCard
          label={t('platform.summary.blocked')}
          value={formatNumber(summary.blocked)}
          icon={<Ban />}
          loading={businesses.isPending}
        />
      </div>
      {businesses.isError ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(businesses.error)}
          action={<Button onClick={() => void businesses.refetch()}>{t('common.retry')}</Button>}
        />
      ) : (
        <DataTable
          caption={t('platform.table')}
          columns={columns}
          rows={rows}
          getRowId={(b) => b.id}
          loading={businesses.isPending}
          searchText={(b) => `${b.name} ${b.id}`}
          searchPlaceholder={t('platform.search')}
          onRowClick={(b) => void navigate(`/platform/businesses/${b.id}`)}
          toolbar={
            <Select
              aria-label={t('platform.filterStatus')}
              className="sm:w-60"
              value={status}
              onValueChange={(value) => {
                setStatus(STATUS_FILTERS.find((option) => option === value) ?? 'all');
              }}
              options={STATUS_FILTERS.map((value) => ({
                value,
                label: value === 'all' ? t('platform.filter.all') : t(`businessStatus.${value}`),
              }))}
            />
          }
          emptyState={
            <EmptyState
              icon={<Building2 />}
              title={all.length === 0 ? t('platform.empty') : t('platform.emptyFilter')}
              description={all.length === 0 ? t('platform.emptyHint') : undefined}
            />
          }
        />
      )}
      <Drawer
        open={creating}
        onOpenChange={setCreating}
        title={t('platform.new')}
        footer={
          <Button
            type="submit"
            form="platform-business-form"
            size="lg"
            fullWidth
            loading={create.isPending}
            disabled={!online}
          >
            {t('platform.form.create')}
          </Button>
        }
      >
        {creating ? (
          <PlatformBusinessForm
            offline={!online}
            error={create.error}
            onSubmit={(input) => {
              create.mutate(
                { input, adminUid: user.uid },
                {
                  onSuccess: (bid) => {
                    setCreating(false);
                    toast({ title: t('platform.created'), tone: 'success' });
                    void navigate(`/platform/businesses/${bid}`);
                  },
                },
              );
            }}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
