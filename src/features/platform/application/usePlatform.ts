import { useMutation, useQuery } from '@tanstack/react-query';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import type { PlatformBusinessInput } from '../domain/platformBusiness';
import {
  changeBusinessStatus,
  createPlatformBusiness,
  fetchUsage,
  updatePlatformBusiness,
  watchAllBusinesses,
} from '../infrastructure/platformRepository';

export const usePlatformBusinesses = () =>
  useLiveQuery(['platform', 'businesses'], watchAllBusinesses());

/** Conteo de registros por colección. Solo en línea; se refresca a demanda. */
export function useBusinessUsage(bid: string) {
  const online = useOnlineStatus();
  return useQuery({
    queryKey: ['platform', 'usage', bid],
    queryFn: () => fetchUsage(bid),
    enabled: online,
    staleTime: 60_000,
  });
}

interface CreateVariables {
  input: PlatformBusinessInput;
  adminUid: string;
}

/** El alta se espera (requiere red): crea el negocio y la invitación del dueño. */
export function useCreatePlatformBusiness() {
  return useMutation({
    mutationFn: ({ input, adminUid }: CreateVariables) => createPlatformBusiness(input, adminUid),
  });
}

/** Edición y cambios de estado: optimistas y encolados offline. */
export const platformWrites = { updatePlatformBusiness, changeBusinessStatus };
