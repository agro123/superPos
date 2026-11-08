import {
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { LiveDoc, Subscribe, Synced } from '@/shared/domain/live';
import { z } from 'zod';
import { AppError } from '@/shared/domain/errors';
import { SEAT_IDS } from '@/shared/domain/plan';
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
import { customRoleSchema, type CustomRole, type CustomRoleInput } from '../domain/customRole';
import { memberSchema, type Member, type MemberUpdate } from '../domain/member';

const db = () => getFirebase().db;
const memberConverter = zodConverter(memberSchema);
const invitationConverter = zodConverter(invitationSchema);
const roleConverter = zodConverter(customRoleSchema);
const seatConverter = zodConverter(z.object({ id: z.string(), uid: z.string() }));
const rolesCol = (bid: string) => collection(db(), 'businesses', bid, 'roles');

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

export const watchSeats = (bid: string): Subscribe<Synced<{ id: string; uid: string }>[]> =>
  watchQuery(collection(db(), 'businesses', bid, 'seats').withConverter(seatConverter));

/**
 * Cambia el acceso de un miembro y, en el mismo batch, toma o libera su cupo: un trabajador activo
 * (no admin) necesita uno (`seatId`); al desactivarlo o volverlo admin se libera.
 */
export function updateMember(
  bid: string,
  member: Pick<Member, 'id' | 'seatId'>,
  update: MemberUpdate,
  seatToTake: string | null,
  adminUid: string,
): void {
  const needsSeat = update.role !== 'admin' && update.status === 'active';
  const batch = writeBatch(db());
  const memberRef = doc(db(), 'businesses', bid, 'members', member.id);
  if (needsSeat && !member.seatId && seatToTake) {
    batch.update(memberRef, { ...update, seatId: seatToTake, ...updateAudit() });
    batch.set(doc(db(), 'businesses', bid, 'seats', seatToTake), {
      uid: member.id,
      ...createAudit(adminUid),
    });
  } else if (!needsSeat && member.seatId) {
    batch.update(memberRef, { ...update, seatId: null, ...updateAudit() });
    batch.delete(doc(db(), 'businesses', bid, 'seats', member.seatId));
  } else {
    batch.update(memberRef, { ...update, ...updateAudit() });
  }
  trackWrite(batch.commit(), 'members.update');
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
      customRoleId: input.customRoleId,
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
  const bid = invitation.businessId;
  // Un trabajador ocupa un cupo libre; el invitado no conoce el plan: las reglas rechazan un cupo
  // que el plan no tenga (p. ej. el 2 en el plan gratuito).
  let seatId: string | null = null;
  if (invitation.role !== 'admin') {
    try {
      const taken = new Set(
        (await getDocs(collection(db(), 'businesses', bid, 'seats'))).docs.map((d) => d.id),
      );
      seatId = SEAT_IDS.find((id) => !taken.has(id)) ?? null;
    } catch (error) {
      throw mapFirebaseError(error);
    }
    if (!seatId) throw new AppError('conflict', 'El negocio no tiene cupos de trabajador libres');
  }
  const batch = writeBatch(db());
  if (seatId)
    batch.set(doc(db(), 'businesses', bid, 'seats', seatId), {
      uid: user.uid,
      ...createAudit(user.uid),
    });
  batch.set(doc(db(), 'businesses', invitation.businessId, 'members', user.uid), {
    displayName: user.displayName,
    email: user.email,
    role: invitation.role,
    extraPermissions: invitation.extraPermissions,
    customRoleId: invitation.customRoleId,
    seatId,
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
    const mapped = mapFirebaseError(error);
    // Rechazo por cupo: el plan del negocio no admite más trabajadores.
    throw seatId && mapped.code === 'permission_denied'
      ? new AppError('conflict', 'El negocio alcanzó el límite de trabajadores de su plan', {
          cause: error,
        })
      : mapped;
  }
}

export const watchRoles = (bid: string): Subscribe<Synced<CustomRole>[]> =>
  watchQuery(rolesCol(bid).withConverter(roleConverter));

/**
 * Crea o edita un rol. Al editar, actualiza en el mismo batch los permisos de los miembros que lo
 * tienen (las reglas leen `extraPermissions`, no el rol: así no hay lecturas extra por petición).
 */
export function saveRole(
  bid: string,
  roleId: string | null,
  input: CustomRoleInput,
  members: readonly Pick<Member, 'id' | 'customRoleId'>[],
  uid: string,
): void {
  const batch = writeBatch(db());
  if (roleId) {
    batch.update(doc(rolesCol(bid), roleId), { ...input, ...updateAudit() });
    for (const member of members.filter((m) => m.customRoleId === roleId)) {
      batch.update(doc(db(), 'businesses', bid, 'members', member.id), {
        extraPermissions: input.permissions,
        ...updateAudit(),
      });
    }
  } else {
    batch.set(doc(rolesCol(bid)), { ...input, ...createAudit(uid) });
  }
  trackWrite(batch.commit(), 'roles.save');
}

export function deleteRole(bid: string, roleId: string): void {
  trackWrite(deleteDoc(doc(rolesCol(bid), roleId)), 'roles.delete');
}
