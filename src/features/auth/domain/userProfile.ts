import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';

/** `users/{uid}`: perfil global. `businessIds` es un índice de conveniencia, no una autorización. */
export const userProfileSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().trim().min(1).max(80),
    email: z.email(),
    businessIds: z.array(z.string().min(1)),
  })
  .extend(auditFieldsSchema.shape);

export type UserProfile = z.infer<typeof userProfileSchema>;
