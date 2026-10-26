import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Escribe un email válido' }));

export const loginInputSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Escribe tu contraseña' }),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const signUpInputSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Mínimo 2 caracteres' }).max(80),
  email,
  /** Firebase exige 6; pedimos 8 como mínimo razonable. */
  password: z.string().min(8, { error: 'Mínimo 8 caracteres' }).max(128),
});
export type SignUpInput = z.infer<typeof signUpInputSchema>;

export const passwordResetInputSchema = z.object({ email });
export type PasswordResetInput = z.infer<typeof passwordResetInputSchema>;
