import { t } from '@/shared/lib/i18n';
import { TaxesPanel } from '../ui/TaxesPanel';
import { SettingsSection } from '../ui/SettingsSection';

export default function TaxesSettingsPage() {
  return (
    <SettingsSection title={t('settings.taxes')} description={t('settings.taxesHint')}>
      <TaxesPanel />
    </SettingsSection>
  );
}
