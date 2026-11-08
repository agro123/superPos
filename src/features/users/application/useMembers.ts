import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import { t } from '@/shared/lib/i18n';
import type { Role } from '../domain/permissions';
import type { Invitation } from '../domain/invitation';
import {
  acceptInvitation,
  findMyInvitations,
  inviteMember,
  revokeInvitation,
  updateMember,
  watchInvitations,
  watchMembers,
  watchRoles,
  watchSeats,
  saveRole,
  deleteRole,
} from '../infrastructure/memberRepository';

export const useMembers = (bid: string) => useLiveQuery(['members', bid], watchMembers(bid));
export const useRoles = (bid: string) => useLiveQuery(['roles', bid], watchRoles(bid));

/** Cupos de trabajador ocupados (`seats/{id}`). */
export function useTakenSeats(bid: string): ReadonlySet<string> {
  const seats = useLiveQuery(['seats', bid], watchSeats(bid));
  return new Set((seats.data ?? []).map((seat) => seat.id));
}

/** Nombre visible del rol de un miembro o invitación (los personalizados, por su nombre). */
export function useRoleLabel(bid: string): (role: Role, customRoleId: string | null) => string {
  const roles = useRoles(bid);
  return (role, customRoleId) =>
    role === 'custom'
      ? (roles.data?.find((r) => r.id === customRoleId)?.name ?? t('role.custom'))
      : t(`role.${role}`);
}
export const useBusinessInvitations = (bid: string) =>
  useLiveQuery(['invitations', bid], watchInvitations(bid));

/** Invitaciones para mi email. Requiere email verificado (lo exigen las reglas). */
export function useMyInvitations(email: string, emailVerified: boolean) {
  return useQuery({
    queryKey: ['myInvitations', email],
    queryFn: () => findMyInvitations(email),
    enabled: emailVerified,
  });
}

interface AcceptInvitationVariables {
  invitation: Invitation;
  user: { uid: string; email: string; displayName: string };
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitation, user }: AcceptInvitationVariables) =>
      acceptInvitation(invitation, user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myInvitations'] }),
  });
}

/** Escrituras de administración de miembros: optimistas y encoladas offline. */
export const memberWrites = { updateMember, inviteMember, revokeInvitation, saveRole, deleteRole };
