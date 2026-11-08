import { PremiumNotice, usePlan } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { PageHeader } from '@/shared/ui';
import { ReportsContent } from '../ui/ReportsContent';

/**
 * Reportes: función premium (propuesta SmartPOS). Se oculta en la app; los datos de ventas siguen
 * siendo legibles para el POS e Inicio, así que no es una barrera de seguridad (ADR 0015).
 */
export default function ReportsPage() {
  const { limits } = usePlan();
  if (limits.reports) return <ReportsContent />;
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={t('reports.title')} description={t('reports.description')} />
      <PremiumNotice title={t('plan.reportsTitle')} description={t('plan.reportsHint')} />
    </div>
  );
}
