import { ProductImportPanel } from '@/features/catalog';
import { t } from '@/shared/lib/i18n';
import { SettingsSection } from '../ui/SettingsSection';

export default function ImportSettingsPage() {
  return (
    <SettingsSection title={t('import.title')} description={t('import.description')}>
      <ProductImportPanel />
    </SettingsSection>
  );
}
