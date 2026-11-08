import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness, usePlan } from '@/features/business';
import { EmployeesPanel, RolesPanel } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { SettingsSection } from '../ui/SettingsSection';

export default function EmployeesSettingsPage() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const { plan } = usePlan();
  return (
    <SettingsSection title={t('employees.title')} description={t('employees.description')}>
      <EmployeesPanel
        businessId={business.id}
        businessName={business.name}
        ownerUid={business.ownerUid}
        currentUid={user.uid}
        plan={plan}
      />
      <div className="mt-8">
        <RolesPanel businessId={business.id} currentUid={user.uid} plan={plan} />
      </div>
    </SettingsSection>
  );
}
