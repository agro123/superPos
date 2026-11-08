import { t } from '@/shared/lib/i18n';
import { PlanPanel } from '../ui/PlanPanel';
import { SettingsSection } from '../ui/SettingsSection';

export default function PlanSettingsPage() {
  return (
    <SettingsSection title={t('plan.title')} description={t('plan.description')}>
      <PlanPanel />
    </SettingsSection>
  );
}
