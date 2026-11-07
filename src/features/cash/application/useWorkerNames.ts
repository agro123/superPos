import { useMembers } from '@/features/users';
import { t } from '@/shared/lib/i18n';

/** Nombre visible de un trabajador por uid (los ids que ya no son miembros se muestran abreviados). */
export function useWorkerNames(bid: string): (uid: string) => string {
  const members = useMembers(bid);
  return (uid) =>
    members.data?.find((m) => m.id === uid)?.displayName ??
    t('cash.unknownWorker', { id: uid.slice(0, 6) });
}
