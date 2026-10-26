import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useCurrentUser, useUserProfile } from '@/features/auth';
import {
  ActiveBusinessProvider,
  useActiveBusinessId,
  useActiveBusinessStore,
} from '@/features/business';
import { CurrentMemberProvider } from '@/features/users';
import { resolveBusinessAccess } from './access';
import { BusinessUnavailable } from './BusinessUnavailable';
import { FullScreenError, FullScreenLoader } from './FullScreenStatus';

/** Exige un negocio activo del que el usuario sea miembro activo, y lo expone por contexto. */
export function RequireBusiness() {
  const user = useCurrentUser();
  const profile = useUserProfile(user.uid);
  const activeBusinessId = useActiveBusinessId(user.uid);
  const { setActive, clear } = useActiveBusinessStore();
  const access = resolveBusinessAccess({
    profile: profile.data,
    profileError: profile.isError,
    activeBusinessId,
    platformAdmin: user.platformAdmin,
  });

  useEffect(() => {
    if (access.kind === 'select') setActive(user.uid, access.businessId);
  }, [access, setActive, user.uid]);

  switch (access.kind) {
    case 'loading':
    case 'select':
      return <FullScreenLoader />;
    case 'error':
    case 'offline':
      return (
        <FullScreenError
          offline={access.kind === 'offline'}
          onRetry={() => void profile.refetch()}
        />
      );
    case 'redirect':
      return <Navigate to={access.to} replace />;
    case 'ready':
      return (
        <ActiveBusinessProvider
          businessId={access.businessId}
          loading={<FullScreenLoader />}
          renderError={(retry) => <FullScreenError onRetry={retry} />}
          renderUnavailable={(status) => <BusinessUnavailable status={status} />}
        >
          <CurrentMemberProvider
            businessId={access.businessId}
            uid={user.uid}
            loading={<FullScreenLoader />}
            renderError={(retry) => <FullScreenError onRetry={retry} />}
            renderNotMember={() => (
              <LeaveBusiness
                onLeave={() => {
                  clear(user.uid);
                }}
              />
            )}
          >
            <Outlet />
          </CurrentMemberProvider>
        </ActiveBusinessProvider>
      );
  }
}

/** El usuario ya no es miembro activo: se limpia el negocio activo y vuelve al selector. */
function LeaveBusiness({ onLeave }: { onLeave: () => void }) {
  useEffect(onLeave, [onLeave]);
  return <Navigate to="/select-business" replace />;
}
