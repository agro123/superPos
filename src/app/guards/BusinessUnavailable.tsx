import { Ban } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusinessStore, type BusinessStatus } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { Button, EmptyState } from '@/shared/ui';

/** El negocio activo fue bloqueado o eliminado por la plataforma. */
export function BusinessUnavailable({ status }: { status: Exclude<BusinessStatus, 'active'> }) {
  const user = useCurrentUser();
  const clear = useActiveBusinessStore((state) => state.clear);
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <EmptyState
        tone="danger"
        icon={<Ban />}
        title={t(`businessUnavailable.${status}Title`)}
        description={t('businessUnavailable.hint')}
        action={
          <Button
            onClick={() => {
              clear(user.uid);
              void navigate('/select-business', { replace: true });
            }}
          >
            {t('businessUnavailable.switch')}
          </Button>
        }
      />
    </div>
  );
}
