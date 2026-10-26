import { ChevronRight, Store } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useCurrentUser, useSignOut, useUserProfile } from '@/features/auth';
import { PendingInvitations } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { AuthLayout, Button, Logo, Skeleton } from '@/shared/ui';
import { useActiveBusinessStore } from '../application/activeBusinessStore';
import { useBusinessDoc } from '../application/useBusinessData';

function BusinessOption({
  businessId,
  onSelect,
}: {
  businessId: string;
  onSelect: (id: string) => void;
}) {
  const business = useBusinessDoc(businessId);
  const value = business.data?.value;
  if (business.isPending) return <Skeleton className="h-14" />;
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={() => {
        onSelect(businessId);
      }}
      className="flex min-h-14 w-full items-center gap-3 rounded-md border border-border px-4 text-left hover:bg-surface-muted"
    >
      <Store aria-hidden className="size-5 text-primary" />
      <span className="flex-1">
        <span className="block font-medium text-text">{value.name}</span>
        <span className="block text-xs text-text-subtle">{t(`businessType.${value.type}`)}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 text-text-subtle" />
    </button>
  );
}

/** Selector de negocio para usuarios que pertenecen a varios. */
export default function SelectBusinessPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const profile = useUserProfile(user.uid);
  const setActive = useActiveBusinessStore((state) => state.setActive);
  const signOut = useSignOut();
  const businessIds = profile.data?.value?.businessIds ?? [];

  const enter = (businessId: string) => {
    setActive(user.uid, businessId);
    void navigate('/', { replace: true });
  };

  if (profile.data && !profile.data.fromCache && businessIds.length === 0)
    return <Navigate to="/onboarding" replace />;

  return (
    <AuthLayout
      brand={<Logo />}
      title={t('selectBusiness.title')}
      description={t('selectBusiness.description')}
      footer={
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/onboarding">{t('selectBusiness.create')}</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              signOut.mutate();
            }}
          >
            {t('user.logout')}
          </Button>
        </div>
      }
    >
      <ul aria-label={t('selectBusiness.list')} className="flex flex-col gap-2">
        {profile.isPending ? <Skeleton className="h-14" /> : null}
        {businessIds.map((businessId) => (
          <li key={businessId}>
            <BusinessOption businessId={businessId} onSelect={enter} />
          </li>
        ))}
      </ul>
      <PendingInvitations onAccepted={enter} />
    </AuthLayout>
  );
}
