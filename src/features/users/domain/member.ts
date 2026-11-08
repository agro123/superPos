import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { PERMISSIONS, ROLES } from './permissions';

export const MEMBER_STATUSES = ['active', 'disabled'] as const;

/** `businesses/{bid}/members/{uid}`: pertenencia de un usuario a un negocio. */
export const memberSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().trim().min(1).max(80),
    email: z.email(),
    role: z.enum(ROLES),
    extraPermissions: z.array(z.enum(PERMISSIONS)),
    status: z.enum(MEMBER_STATUSES),
    /** Rol personalizado (`roles/{id}`) si `role == 'custom'`. */
    customRoleId: z.string().nullable().default(null),
  })
  .extend(auditFieldsSchema.shape);

export type Member = z.infer<typeof memberSchema>;

/** Cambios que un admin puede hacer sobre un miembro. */
export const memberUpdateSchema = z.object({
  role: z.enum(ROLES),
  extraPermissions: z.array(z.enum(PERMISSIONS)),
  status: z.enum(MEMBER_STATUSES),
  customRoleId: z.string().nullable(),
});

export type MemberUpdate = z.infer<typeof memberUpdateSchema>;
