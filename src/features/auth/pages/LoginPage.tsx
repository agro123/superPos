import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { t } from '@/shared/lib/i18n';
import { AuthLayout, Button, Logo, Tabs, Text } from '@/shared/ui';
import { useSession } from '../application/useSession';
import { LoginForm } from '../ui/LoginForm';
import { PasswordResetForm } from '../ui/PasswordResetForm';
import { SignUpForm } from '../ui/SignUpForm';

function redirectTarget(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string')
    return state.from;
  return '/';
}

export default function LoginPage() {
  const { status } = useSession();
  const location = useLocation();
  const online = useOnlineStatus();
  const [resetting, setResetting] = useState(false);

  if (status === 'signedIn') return <Navigate to={redirectTarget(location.state)} replace />;

  return (
    <AuthLayout
      brand={<Logo />}
      title={resetting ? t('auth.reset.title') : t('auth.login.title')}
      description={resetting ? undefined : t('app.tagline')}
    >
      {!online ? (
        <Text role="status" className="rounded-md bg-warning-soft p-3 text-sm text-warning-soft-fg">
          {t('auth.offline')}
        </Text>
      ) : null}
      {resetting ? (
        <PasswordResetForm
          disabled={!online}
          onBack={() => {
            setResetting(false);
          }}
        />
      ) : (
        <>
          <Tabs
            label={t('auth.formLabel')}
            items={[
              {
                value: 'login',
                label: t('auth.login.tab'),
                content: <LoginForm disabled={!online} />,
              },
              {
                value: 'signup',
                label: t('auth.signup.tab'),
                content: <SignUpForm disabled={!online} />,
              },
            ]}
          />
          <Button
            variant="ghost"
            onClick={() => {
              setResetting(true);
            }}
          >
            {t('auth.reset.link')}
          </Button>
        </>
      )}
    </AuthLayout>
  );
}
