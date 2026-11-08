import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { PERMISSIONS, ROLES } from './permissions';

/** Email normalizado: es el id del documento de invitación. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** `businesses/{bid}/invitations/{email}`. La acepta quien inicie sesión con ese email verificado. */
export const invitationSchema = z
  .object({
    id: z.string().min(3),
    email: z.email(),
    role: z.enum(ROLES),
    extraPermissions: z.array(z.enum(PERMISSIONS)),
    businessId: z.string().min(1),
    businessName: z.string().min(1),
    customRoleId: z.string().nullable().default(null),
  })
  .extend(auditFieldsSchema.shape);

export type Invitation = z.infer<typeof invitationSchema>;

export const invitationInputSchema = z.object({
  email: z
    .string()
    .transform(normalizeEmail)
    .pipe(z.email({ error: 'Escribe un email válido' })),
  role: z.enum(ROLES),
  extraPermissions: z.array(z.enum(PERMISSIONS)),
  customRoleId: z.string().nullable(),
});

export type InvitationInput = z.infer<typeof invitationInputSchema>;
