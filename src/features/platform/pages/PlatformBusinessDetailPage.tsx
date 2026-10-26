import { Pencil, SearchX } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatDateTime } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, Drawer, EmptyState, Heading, PageHeader, Skeleton } from '@/shared/ui';
import {
  platformWrites,
  useBusinessUsage,
  usePlatformBusinesses,
} from '../application/usePlatform';
import { BusinessStatusPanel } from '../ui/BusinessStatusPanel';
import { BusinessUsagePanel } from '../ui/BusinessUsagePanel';
import { PlanBadge } from '../ui/PlanBadge';
import { PlatformBusinessEditForm } from '../ui/PlatformBusinessEditForm';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-text-subtle">{label}</dt>
      <dd className="text-sm break-all text-text">{children}</dd>
    </div>
  );
}

const back = { to: '/platform', label: t('platform.detail.back') };

/** Detalle de un negocio para el super admin: datos, plan, estado y uso. */
export default function PlatformBusinessDetailPage() {
  const { businessId = '' } = useParams();
  const toast = useToast();
  const online = useOnlineStatus();
  const businesses = usePlatformBusinesses();
  const usage = useBusinessUsage(businessId);
  const [editing, setEditing] = useState(false);
  const business = businesses.data?.find((candidate) => candidate.id === businessId);

  if (businesses.isError)
    return (
      <EmptyState
        className="m-4"
        tone="danger"
        title={t('common.loadError')}
        description={errorMessage(businesses.error)}
        action={<Button onClick={() => void businesses.refetch()}>{t('common.retry')}</Button>}
      />
    );
  if (businesses.isPending) return <Skeleton className="m-4 h-96" />;
  if (!business)
    return (
      <div className="p-4 md:p-6">
        <PageHeader title={t('platform.detail.notFound')} backTo={back} />
        <EmptyState icon={<SearchX />} title={t('platform.detail.notFound')} />
      </div>
    );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={business.name}
        description={t(`businessType.${business.type}`)}
        backTo={back}
        actions={
          <Button
            variant="outline"
            leftIcon={<Pencil aria-hidden className="size-5" />}
            onClick={() => {
              setEditing(true);
            }}
          >
            {t('common.edit')}
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="info-title"
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Heading id="info-title" level={2} size="md">
                {t('platform.detail.info')}
              </Heading>
              <PlanBadge plan={business.plan} />
              {business.pendingSync ? <Badge>{t('common.pendingSync')}</Badge> : null}
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label={t('platform.detail.id')}>{business.id}</Field>
              <Field label={t('platform.detail.owner')}>
                {business.ownerUid ?? t('platform.detail.ownerPending')}
              </Field>
              <Field label={t('platform.detail.currency')}>
                {t(`currency.${business.currency}`)}
              </Field>
              <Field label={t('platform.detail.timezone')}>{business.timezone}</Field>
              <Field label={t('platform.createdAt')}>
                {formatDateTime(business.createdAt, business.timezone)}
              </Field>
            </dl>
          </section>
          <div className="rounded-lg border border-border bg-surface p-4">
            <BusinessStatusPanel
              business={business}
              onChange={(to) => {
                platformWrites.changeBusinessStatus(business, to);
                toast({
                  title: t('platform.status.changed'),
                  description: online ? undefined : t('common.savedOffline'),
                  tone: 'success',
                });
              }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <BusinessUsagePanel
            counts={usage.data}
            loading={usage.isPending}
            refreshing={usage.isFetching && !usage.isPending}
            error={usage.error}
            offline={!online}
            onRefresh={() => void usage.refetch()}
          />
        </div>
      </div>
      <Drawer
        open={editing}
        onOpenChange={setEditing}
        title={t('platform.detail.edit')}
        footer={
          <Button type="submit" form="platform-business-edit-form" size="lg" fullWidth>
            {t('common.save')}
          </Button>
        }
      >
        {editing ? (
          <PlatformBusinessEditForm
            business={business}
            onSubmit={(update) => {
              platformWrites.updatePlatformBusiness(business.id, update);
              setEditing(false);
              toast({ title: t('common.saved'), tone: 'success' });
            }}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
