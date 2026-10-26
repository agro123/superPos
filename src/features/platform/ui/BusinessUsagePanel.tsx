import { RefreshCw, WifiOff } from 'lucide-react';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState, Heading, Skeleton, Text } from '@/shared/ui';
import { totalRecords, USAGE_COLLECTIONS, type UsageCounts } from '../domain/platformBusiness';

export interface BusinessUsagePanelProps {
  counts: UsageCounts | undefined;
  loading: boolean;
  refreshing: boolean;
  error: unknown;
  offline: boolean;
  onRefresh: () => void;
}

/** Registros por colección de un negocio, con total. Los datos llegan ya resueltos. */
export function BusinessUsagePanel({
  counts,
  loading,
  refreshing,
  error,
  offline,
  onRefresh,
}: BusinessUsagePanelProps) {
  const body = (() => {
    if (offline && !counts)
      return <EmptyState icon={<WifiOff />} title={t('platform.usage.offline')} />;
    if (error && !counts)
      return (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(error)}
          action={<Button onClick={onRefresh}>{t('common.retry')}</Button>}
        />
      );
    if (loading || !counts) return <Skeleton className="h-72" />;
    return (
      <table className="w-full text-sm">
        <caption className="sr-only">{t('platform.usage.table')}</caption>
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th scope="col" className="py-2 font-medium">
              {t('platform.usage.collection')}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {t('platform.usage.records')}
            </th>
          </tr>
        </thead>
        <tbody>
          {USAGE_COLLECTIONS.map((collection) => (
            <tr key={collection} className="border-b border-border">
              <th scope="row" className="py-2 text-left font-normal text-text">
                {t(`platform.usage.${collection}`)}
              </th>
              <td className="py-2 text-right text-text tabular-nums">
                {formatNumber(counts[collection])}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-3 text-left font-semibold text-text">
              {t('platform.usage.total')}
            </th>
            <td className="pt-3 text-right font-semibold text-text tabular-nums">
              {formatNumber(totalRecords(counts))}
            </td>
          </tr>
        </tfoot>
      </table>
    );
  })();

  return (
    <section aria-labelledby="usage-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading id="usage-title" level={2} size="md">
            {t('platform.usage.title')}
          </Heading>
          <Text variant="muted">{t('platform.usage.description')}</Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw aria-hidden />}
          loading={refreshing}
          disabled={offline}
          onClick={onRefresh}
        >
          {t('platform.usage.refresh')}
        </Button>
      </div>
      {body}
    </section>
  );
}
