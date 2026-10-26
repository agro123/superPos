import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@/shared/hooks/useLiveQuery';
import type { Invitation } from '../domain/invitation';
import {
  acceptInvitation,
  findMyInvitations,
  inviteMember,
  revokeInvitation,
  updateMember,
  watchInvitations,
  watchMembers,
} from '../infrastructure/memberRepository';

export const useMembers = (bid: string) => useLiveQuery(['members', bid], watchMembers(bid));
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
export const memberWrites = { updateMember, inviteMember, revokeInvitation };
