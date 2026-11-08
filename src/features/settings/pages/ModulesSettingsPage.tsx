import { t } from '@/shared/lib/i18n';
import { ModulesPanel } from '../ui/ModulesPanel';
import { SettingsSection } from '../ui/SettingsSection';

export default function ModulesSettingsPage() {
  return (
    <SettingsSection title={t('settings.modules')} description={t('settings.modulesHint')}>
      <ModulesPanel />
    </SettingsSection>
  );
}
