import { Navigate, Outlet } from 'react-router';
import { useIsLocked } from '@/features/auth';

/** Si la pantalla está bloqueada con PIN, todo redirige a /lock. */
export function RequireUnlocked() {
  return useIsLocked() ? <Navigate to="/lock" replace /> : <Outlet />;
}
