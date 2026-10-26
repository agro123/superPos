import { createContext, useContext } from 'react';
import type { Member } from '../domain/member';
import { hasPermission, type Permission } from '../domain/permissions';

/** Miembro actual del negocio activo (`null` si no pertenece o está desactivado). */
export const CurrentMemberContext = createContext<Member | null>(null);

export function useCurrentMember(): Member | null {
  return useContext(CurrentMemberContext);
}

/**
 * `true` si el miembro actual tiene el permiso. Solo experiencia de usuario:
 * la autorización real la hacen las Security Rules.
 */
export function usePermission(permission: Permission): boolean {
  return hasPermission(useCurrentMember(), permission);
}
