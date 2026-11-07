import { useActiveBusiness } from '@/features/business';
import { TerminalsPanel } from '@/features/terminals';
import { t } from '@/shared/lib/i18n';
import { SettingsSection } from '../ui/SettingsSection';

export default function TerminalsSettingsPage() {
  const { business } = useActiveBusiness();
  return (
    <SettingsSection title={t('terminals.title')} description={t('terminals.description')}>
      <TerminalsPanel
        businessId={business.id}
        businessName={business.name}
        timezone={business.timezone}
      />
    </SettingsSection>
  );
}
