import { FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness } from '@/features/business';
import { CashByWorkerReport } from '@/features/cash';
import { useToast } from '@/shared/hooks/useToast';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState, PageHeader, Select, Tabs } from '@/shared/ui';
import { exportExcel, exportPdf } from '../application/reportExport';
import { useAiAdvisor } from '../application/useAiAdvisor';
import { useReportsData } from '../application/useReportsData';
import { AiAdvisorPanel } from './AiAdvisorPanel';
import { InsightsSection } from './InsightsSection';
import { PerformanceSection } from './PerformanceSection';
import { ProfitSection } from './ProfitSection';
import { SalesOverview } from './SalesOverview';

const RANGES = [7, 14, 30, 90] as const;

/** Reportes del periodo: ventas, ganancia y trabajadores, exportables a Excel y PDF. */
export function ReportsContent() {
  const { business } = useActiveBusiness();
  const toast = useToast();
  const [days, setDays] = useState<number>(14);
  const data = useReportsData(business.id, business.timezone, days);
  const [exporting, setExporting] = useState(false);
  const advisor = useAiAdvisor(data, days);
  const ctx = {
    businessName: business.name,
    currency: business.currency,
    timeZone: business.timezone,
    days,
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<FileSpreadsheet aria-hidden className="size-5" />}
              disabled={data.loading}
              onClick={() => {
                exportExcel(data, ctx);
              }}
            >
              {t('reports.exportExcel')}
            </Button>
            <Button
              variant="outline"
              leftIcon={<FileText aria-hidden className="size-5" />}
              disabled={data.loading}
              loading={exporting}
              onClick={() => {
                setExporting(true);
                exportPdf(data, ctx)
                  .catch(() => {
                    toast({ title: t('reports.exportFailed'), tone: 'danger' });
                  })
                  .finally(() => {
                    setExporting(false);
                  });
              }}
            >
              {t('reports.exportPdf')}
            </Button>
          </div>
        }
      />
      <div role="group" aria-label={t('reports.filters')} className="flex flex-wrap gap-2">
        <Select
          aria-label={t('reports.range')}
          className="w-56"
          value={String(days)}
          onValueChange={(value) => {
            setDays(Number(value));
          }}
          options={RANGES.map((value) => ({
            value: String(value),
            label: t('common.lastDays', { days: value }),
          }))}
        />
      </div>
      {data.query.isError ? (
        <EmptyState
          tone="danger"
          title={t('common.loadError')}
          description={errorMessage(data.query.error)}
          action={<Button onClick={() => void data.query.refetch()}>{t('common.retry')}</Button>}
        />
      ) : (
        <Tabs
          label={t('reports.sections')}
          items={[
            {
              value: 'sales',
              label: t('reports.tab.sales'),
              content: (
                <div className="flex flex-col gap-6">
                  <SalesOverview
                    report={data}
                    loading={data.query.isPending}
                    currency={business.currency}
                    timeZone={business.timezone}
                  />
                  {data.query.isPending ? null : (
                    <InsightsSection
                      sales={data.sales}
                      currency={business.currency}
                      timeZone={business.timezone}
                      days={days}
                      workerName={data.workerName}
                    />
                  )}
                </div>
              ),
            },
            {
              value: 'profit',
              label: t('reports.tab.profit'),
              content: (
                <ProfitSection
                  report={data.profit}
                  currency={business.currency}
                  loading={data.loading}
                />
              ),
            },
            {
              value: 'ai',
              label: t('reports.tab.ai'),
              content: <AiAdvisorPanel advisor={advisor} loading={data.loading} />,
            },
            {
              value: 'workers',
              label: t('reports.tab.workers'),
              content: (
                <div className="flex flex-col gap-8">
                  <PerformanceSection
                    rows={data.performance}
                    currency={business.currency}
                    loading={data.loading}
                    workerName={data.workerName}
                  />
                  <CashByWorkerReport
                    businessId={business.id}
                    currency={business.currency}
                    days={days}
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
