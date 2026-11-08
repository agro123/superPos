import { t } from '@/shared/lib/i18n';
import { BusinessPanel } from '../ui/BusinessPanel';
import { SettingsSection } from '../ui/SettingsSection';

export default function BusinessSettingsPage() {
  return (
    <SettingsSection title={t('settings.business')}>
      <BusinessPanel />
    </SettingsSection>
  );
}
