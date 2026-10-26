import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { AppError } from '@/shared/domain/errors';
import { formatTime } from '@/shared/lib/formatters';
import { errorMessage } from '@/shared/lib/errorMessage';
import { t } from '@/shared/lib/i18n';
import { AuthLayout, Avatar, Button, Logo, Spinner, Text } from '@/shared/ui';
import { usePinService, useSignOut } from '../application/useAuthActions';
import { useLockStore } from '../application/sessionStore';
import { useCurrentUser } from '../application/useSession';
import { PinEntry } from '../ui/PinEntry';

function pinErrorText(error: AppError): string {
  const lockedUntil = error.details?.lockedUntil;
  if (error.code === 'locked' && typeof lockedUntil === 'number') {
    return t('lock.lockedUntil', {
      time: formatTime(new Date(lockedUntil), Intl.DateTimeFormat().resolvedOptions().timeZone),
    });
  }
  const attempts = error.details?.failedAttempts;
  if (error.code === 'unauthenticated' && typeof attempts === 'number')
    return t('lock.wrongPin', { attempts });
  return errorMessage(error);
}

/** Bloqueo de pantalla con PIN del dispositivo y cambio de empleado (ADR 0008). */
export default function LockPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const pinService = usePinService();
  const { lock, unlock } = useLockStore();
  const signOut = useSignOut();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasPin = useQuery({
    queryKey: ['hasPin', user.uid],
    queryFn: () => pinService.hasPin(user.uid),
  });

  useEffect(() => {
    if (hasPin.data === true) lock(user.uid);
  }, [hasPin.data, lock, user.uid]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = hasPin.data
      ? await pinService.verify(user.uid, pin)
      : await pinService.setPin(user.uid, pin);
    setBusy(false);
    setPin('');
    if (!result.ok) {
      setError(pinErrorText(result.error));
      return;
    }
    if (hasPin.data) {
      unlock();
      void navigate('/', { replace: true });
    } else {
      await hasPin.refetch();
    }
  };

  const switchUser = () => {
    signOut.mutate(undefined, { onSuccess: () => void navigate('/login', { replace: true }) });
  };

  if (hasPin.isPending) return <Spinner className="m-auto" size="lg" />;

  return (
    <AuthLayout
      brand={<Logo />}
      title={hasPin.data ? t('lock.title') : t('lock.setTitle')}
      description={
        hasPin.data ? t('lock.description', { name: user.displayName }) : t('lock.setDescription')
      }
      footer={
        <div className="flex flex-col items-center gap-1 text-center">
          <Button variant="ghost" onClick={switchUser} loading={signOut.isPending}>
            {hasPin.data ? t('lock.switchUser') : t('common.cancel')}
          </Button>
          {hasPin.data ? <Text variant="caption">{t('lock.switchUserHint')}</Text> : null}
        </div>
      }
    >
      <div className="flex justify-center">
        <Avatar name={user.displayName} size="lg" />
      </div>
      <PinEntry value={pin} onValueChange={setPin} onSubmit={() => void submit()} disabled={busy} />
      {error ? (
        <Text variant="danger" role="alert" className="text-center">
          {error}
        </Text>
      ) : null}
      <Button
        size="lg"
        fullWidth
        loading={busy}
        disabled={pin.length < 4}
        onClick={() => void submit()}
      >
        {hasPin.data ? t('lock.unlock') : t('lock.savePin')}
      </Button>
    </AuthLayout>
  );
}
