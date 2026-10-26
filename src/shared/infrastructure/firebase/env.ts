import { z } from 'zod';
import { AppError } from '@/shared/domain/errors';

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_USE_EMULATORS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  VITE_EMULATOR_HOST: z.string().min(1).default('127.0.0.1'),
  VITE_APP_CHECK_SITE_KEY: z.string().default(''),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Configuración desde variables `VITE_*` (L4: cero secretos en el código).
 * La config web de Firebase no es secreta; la seguridad la dan las Security Rules y App Check.
 */
export function readEnv(source: Record<string, unknown> = import.meta.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new AppError('config', `Configuración incompleta: ${missing}. Revisa .env.example.`);
  }
  if (parsed.data.VITE_FIREBASE_PROJECT_ID.startsWith('demo-') && !parsed.data.VITE_USE_EMULATORS) {
    throw new AppError('config', 'Un proyecto demo-* solo funciona con VITE_USE_EMULATORS=true.');
  }
  return parsed.data;
}
