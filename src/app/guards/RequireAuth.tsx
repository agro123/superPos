import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '@/features/auth';
import { resolveSessionAccess } from './access';
import { FullScreenLoader } from './FullScreenStatus';

/** Exige sesión. Sin red se sigue con el último usuario autenticado (sesión persistida). */
export function RequireAuth() {
  const { status } = useSession();
  const location = useLocation();
  const access = resolveSessionAccess(status);
  if (access === 'loading') return <FullScreenLoader />;
  if (access === 'login')
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
