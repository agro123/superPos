import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { defineStateMachine } from '@/shared/domain/stateMachine';

export const TERMINAL_STATUSES = ['active', 'disabled', 'revoked'] as const;
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

/**
 * Terminal autorizado: activo ↔ desactivado (reversible); revocado es final. Un terminal revocado
 * solo vuelve con una nueva vinculación por QR. "Pendiente" no se guarda aquí: es la solicitud de
 * vinculación sin aprobar.
 */
export const terminalStatusMachine = defineStateMachine<TerminalStatus>('terminal', {
  active: ['disabled', 'revoked'],
  disabled: ['active', 'revoked'],
  revoked: [],
});

export const DEVICE_TYPES = ['phone', 'tablet', 'desktop', 'unknown'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

/** Minutos de inactividad antes de cerrar la sesión del trabajador. */
export const IDLE_LOCK_MINUTES = { min: 1, max: 120, default: 5 } as const;

/**
 * `businesses/{bid}/posTerminals/{terminalUid}`. El id es el uid anónimo de Firebase Auth de la
 * instalación: así las reglas reconocen al terminal sin consultas extra. `deviceUuid` identifica la
 * instalación de la PWA, no el aparato físico (se puede copiar o perder).
 */
export const posTerminalSchema = z
  .object({
    id: z.string().min(1),
    deviceUuid: z.uuid(),
    deviceType: z.enum(DEVICE_TYPES),
    name: z.string().trim().min(1).max(40),
    status: z.enum(TERMINAL_STATUSES),
    idleLockMinutes: z.number().int().min(IDLE_LOCK_MINUTES.min).max(IDLE_LOCK_MINUTES.max),
    pairingRequestId: z.string().min(1),
    registeredBy: z.string().min(1),
    authorizedAt: z.date(),
    lastSeenAt: z.date().nullable(),
    revokedAt: z.date().nullable(),
  })
  .extend(auditFieldsSchema.shape);
export type PosTerminal = z.infer<typeof posTerminalSchema>;

export const terminalNameSchema = z.string().trim().min(1).max(40);

export const terminalUpdateSchema = z.object({
  name: terminalNameSchema,
  idleLockMinutes: z.number().int().min(IDLE_LOCK_MINUTES.min).max(IDLE_LOCK_MINUTES.max),
});
export type TerminalUpdate = z.infer<typeof terminalUpdateSchema>;

/** Deduce el tipo de dispositivo a partir de señales del navegador (solo informativo). */
export function detectDeviceType(signals: {
  userAgent: string;
  maxTouchPoints: number;
}): DeviceType {
  const ua = signals.userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return 'tablet';
  if (/mobi|iphone|android/.test(ua)) return 'phone';
  // iPadOS se presenta como Mac con pantalla táctil.
  if (ua.includes('macintosh') && signals.maxTouchPoints > 1) return 'tablet';
  if (/windows|macintosh|linux|cros/.test(ua)) return 'desktop';
  return 'unknown';
}
