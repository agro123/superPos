import {
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { LiveDoc, Subscribe, Synced } from '@/shared/domain/live';
import { getFirebase } from '@/shared/infrastructure/firebase/app';
import { zodConverter } from '@/shared/infrastructure/firebase/converters';
import { mapFirebaseError } from '@/shared/infrastructure/firebase/errors';
import {
  createAudit,
  updateAudit,
  watchDoc,
  watchQuery,
} from '@/shared/infrastructure/firebase/firestore';
import { trackWrite } from '@/shared/infrastructure/offline/trackWrite';
import { invitationSchema, type Invitation, type InvitationInput } from '../domain/invitation';
import { memberSchema, type Member, type MemberUpdate } from '../domain/member';

const db = () => getFirebase().db;
const memberConverter = zodConverter(memberSchema);
const invitationConverter = zodConverter(invitationSchema);

const membersCol = (bid: string) =>
  collection(db(), 'businesses', bid, 'members').withConverter(memberConverter);
const invitationsCol = (bid: string) =>
  collection(db(), 'businesses', bid, 'invitations').withConverter(invitationConverter);

export const watchMember = (bid: string, uid: string): Subscribe<LiveDoc<Member>> =>
  watchDoc(doc(membersCol(bid), uid));

export const watchMembers = (bid: string): Subscribe<Synced<Member>[]> =>
  watchQuery(membersCol(bid));

export const watchInvitations = (bid: string): Subscribe<Synced<Invitation>[]> =>
  watchQuery(invitationsCol(bid));

export function updateMember(bid: string, uid: string, update: MemberUpdate): void {
  trackWrite(
    updateDoc(doc(db(), 'businesses', bid, 'members', uid), { ...update, ...updateAudit() }),
    'members.update',
  );
}

export function inviteMember(
  bid: string,
  businessName: string,
  input: InvitationInput,
  invitedBy: string,
): void {
  trackWrite(
    setDoc(doc(db(), 'businesses', bid, 'invitations', input.email), {
      email: input.email,
      role: input.role,
      extraPermissions: input.extraPermissions,
      businessId: bid,
      businessName,
      ...createAudit(invitedBy),
    }),
    'invitations.create',
  );
}

export function revokeInvitation(bid: string, email: string): void {
  trackWrite(deleteDoc(doc(db(), 'businesses', bid, 'invitations', email)), 'invitations.delete');
}

/** Invitaciones dirigidas al email verificado del usuario (consulta collectionGroup). */
export async function findMyInvitations(email: string): Promise<Invitation[]> {
  try {
    const snapshot = await getDocs(
      query(collectionGroup(db(), 'invitations'), where('email', '==', email)).withConverter(
        invitationConverter,
      ),
    );
    return snapshot.docs.map((item) => item.data());
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

interface Invitee {
  uid: string;
  email: string;
  displayName: string;
}

/** Acepta: crea el miembro con el rol invitado, borra la invitación y agrega el negocio al perfil. */
export async function acceptInvitation(invitation: Invitation, user: Invitee): Promise<void> {
  const batch = writeBatch(db());
  batch.set(doc(db(), 'businesses', invitation.businessId, 'members', user.uid), {
    displayName: user.displayName,
    email: user.email,
    role: invitation.role,
    extraPermissions: invitation.extraPermissions,
    status: 'active',
    ...createAudit(user.uid),
  });
  batch.delete(doc(db(), 'businesses', invitation.businessId, 'invitations', invitation.id));
  batch.update(doc(db(), 'users', user.uid), {
    businessIds: arrayUnion(invitation.businessId),
    ...updateAudit(),
  });
  try {
    await batch.commit();
  } catch (error) {
    throw mapFirebaseError(error);
  }
}
