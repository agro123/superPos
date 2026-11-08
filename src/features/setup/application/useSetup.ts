import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { usePermission } from '@/features/users';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { needsSetup, shouldStartTour } from '../domain/setup';
import {
  markTour,
  saveSetup,
  watchSetup,
  watchTourProgress,
} from '../infrastructure/setupRepository';

export { saveSetup };

/** Estado de la configuración inicial del negocio activo (`null` si es anterior al asistente). */
export function useSetup() {
  const { business } = useActiveBusiness();
  const query = useLiveQuery(['setup', business.id], watchSetup(business.id));
  return { state: query.data?.value ?? null, loading: query.isPending };
}

/** Lleva al asistente a quien puede configurar un negocio con la configuración pendiente. */
export function useSetupRedirect(): void {
  const { state, loading } = useSetup();
  const canManage = usePermission('settings.manage');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pending = !loading && needsSetup(state, canManage);
  useEffect(() => {
    if (pending && pathname !== '/setup') void navigate('/setup', { replace: true });
  }, [pending, pathname, navigate]);
}

/** ¿Debe arrancar el tour para esta persona? y cómo marcarlo visto. */
export function useTourProgress() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const { state, loading } = useSetup();
  const tour = useLiveQuery(
    ['tourProgress', business.id, user.uid],
    watchTourProgress(business.id, user.uid),
  );
  const seen = (tour.data?.value ?? null) !== null;
  return {
    shouldStart: !loading && !tour.isPending && !tour.isError && shouldStartTour(state, seen),
    finish: (status: 'done' | 'skipped') => {
      markTour(business.id, user.uid, status, seen);
    },
  };
}
