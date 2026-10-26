import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { EmployeesPanel } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { SettingsSection } from '../ui/SettingsSection';

export default function EmployeesSettingsPage() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  return (
    <SettingsSection title={t('employees.title')} description={t('employees.description')}>
      <EmployeesPanel
        businessId={business.id}
        businessName={business.name}
        ownerUid={business.ownerUid}
        currentUid={user.uid}
      />
    </SettingsSection>
  );
}
