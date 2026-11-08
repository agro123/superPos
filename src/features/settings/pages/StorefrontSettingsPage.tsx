import { StorefrontPanel } from '@/features/storefront';
import { t } from '@/shared/lib/i18n';
import { SettingsSection } from '../ui/SettingsSection';

export default function StorefrontSettingsPage() {
  return (
    <SettingsSection title={t('storefront.title')} description={t('storefront.description')}>
      <StorefrontPanel />
    </SettingsSection>
  );
}
