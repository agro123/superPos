import { t } from '@/shared/lib/i18n';
import { PaymentsPanel } from '../ui/PaymentsPanel';
import { SettingsSection } from '../ui/SettingsSection';

export default function PaymentsSettingsPage() {
  return (
    <SettingsSection title={t('settings.payments')} description={t('settings.paymentsHint')}>
      <PaymentsPanel />
    </SettingsSection>
  );
}
