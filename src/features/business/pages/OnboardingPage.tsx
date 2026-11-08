import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser, useSignOut, useUserProfile } from '@/features/auth';
import { PendingInvitations } from '@/features/users';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { t } from '@/shared/lib/i18n';
import { AuthLayout, Button, Divider, Logo, Text } from '@/shared/ui';
import { useActiveBusinessStore } from '../application/activeBusinessStore';
import { useCreateBusiness } from '../application/useBusinessData';
import { OnboardingForm } from '../ui/OnboardingForm';

/** Crear el primer negocio (o unirse a uno por invitación). */
export default function OnboardingPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const setActive = useActiveBusinessStore((state) => state.setActive);
  const createBusiness = useCreateBusiness();
  const signOut = useSignOut();

  const profile = useUserProfile(user.uid);
  const [entering, setEntering] = useState<string | null>(null);
  const ready = entering !== null && (profile.data?.value?.businessIds.includes(entering) ?? false);
  // Se navega cuando el perfil ya lista el negocio: si no, la guarda de negocio aún ve el perfil
  // anterior (sin negocios) y devuelve a esta pantalla.
  useEffect(() => {
    if (ready) void navigate('/', { replace: true });
  }, [ready, navigate]);

  const enter = (businessId: string) => {
    setActive(user.uid, businessId);
    setEntering(businessId);
  };

  return (
    <AuthLayout
      brand={<Logo />}
      title={t('onboarding.title')}
      description={t('onboarding.description')}
      footer={
        <Button
          variant="ghost"
          onClick={() => {
            signOut.mutate();
          }}
        >
          {t('user.logout')}
        </Button>
      }
    >
      <OnboardingForm
        disabled={!online}
        submitting={createBusiness.isPending || entering !== null}
        error={createBusiness.error}
        onSubmit={(input) => {
          createBusiness.mutate(
            { input, owner: { uid: user.uid, email: user.email, displayName: user.displayName } },
            { onSuccess: enter },
          );
        }}
      />
      <div className="flex items-center gap-3">
        <Divider className="flex-1" />
        <Text as="span" variant="caption">
          {t('onboarding.or')}
        </Text>
        <Divider className="flex-1" />
      </div>
      <PendingInvitations onAccepted={enter} />
    </AuthLayout>
  );
}
