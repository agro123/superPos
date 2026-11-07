import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';

export const SESSION_STATUSES = ['active', 'closed', 'expired'] as const;
/** Solo contraseña sin servidor; `pin` y `qr` requieren Cloud Functions (ver docs/features/terminals.md). */
export const LOGIN_METHODS = ['password'] as const;

/** `businesses/{bid}/terminalSessions/{id}`: sesión de trabajo de un empleado en un terminal. */
export const terminalSessionSchema = z
  .object({
    id: z.string().min(1),
    terminalId: z.string().min(1),
    memberUid: z.string().min(1),
    loginMethod: z.enum(LOGIN_METHODS),
    status: z.enum(SESSION_STATUSES),
    startedAt: z.date(),
    endedAt: z.date().nullable(),
    lastActivityAt: z.date(),
  })
  .extend(auditFieldsSchema.shape);
export type TerminalSession = z.infer<typeof terminalSessionSchema>;

/** `true` si pasaron `minutes` minutos desde la última actividad. */
export function isIdle(lastActivity: number, now: number, minutes: number): boolean {
  return now - lastActivity >= minutes * 60_000;
}
