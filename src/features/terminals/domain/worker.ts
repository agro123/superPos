import { z } from 'zod';

/**
 * Proyección de `members/{uid}` que lee el terminal para la selección de trabajador. El email se
 * necesita para iniciar sesión con Firebase Auth; no se muestra completo en pantalla.
 */
export const terminalWorkerSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().min(3),
  role: z.enum(['admin', 'employee', 'custom']),
  status: z.enum(['active', 'disabled']),
});
export type TerminalWorker = z.infer<typeof terminalWorkerSchema>;

/** Trabajadores habilitados, ordenados por nombre. */
export function selectableWorkers(workers: readonly TerminalWorker[]): TerminalWorker[] {
  return workers
    .filter((worker) => worker.status === 'active')
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'));
}

/** "carlos@superpos.test" → "c•••s@superpos.test": identifica sin exponer el email completo. */
export function maskEmail(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  if (user.length <= 2) return `${user.slice(0, 1)}•••@${domain}`;
  return `${user.slice(0, 1)}•••${user.slice(-1)}@${domain}`;
}
