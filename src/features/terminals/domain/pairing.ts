import { z } from 'zod';
import { DEVICE_TYPES } from './terminal';

/** Vigencia del QR de vinculación. */
export const PAIRING_TTL_MS = 5 * 60_000;

/** Alfabeto sin caracteres ambiguos (0/O, 1/I/L) para dictar o teclear el código. */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;
/** Prefijo del contenido del QR: distingue el QR de vinculación del QR personal u otros. */
export const PAIRING_QR_PREFIX = 'SUPERPOS-PAIR:';

/**
 * Código de vinculación aleatorio (≈ 40 bits). Junto con la vigencia de 5 min, el uso único y la
 * aprobación explícita de un administrador autenticado, basta para el emparejamiento.
 */
export function generatePairingCode(randomBytes: (length: number) => Uint8Array): string {
  const bytes = randomBytes(CODE_LENGTH * 2);
  let code = '';
  for (const byte of bytes) {
    // Rechazo de sesgo: solo bytes que caen en un múltiplo exacto del alfabeto.
    if (byte >= CODE_ALPHABET.length * Math.floor(256 / CODE_ALPHABET.length)) continue;
    code += CODE_ALPHABET.charAt(byte % CODE_ALPHABET.length);
    if (code.length === CODE_LENGTH) break;
  }
  if (code.length < CODE_LENGTH) return generatePairingCode(randomBytes);
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Normaliza lo que teclea o escanea el administrador: mayúsculas, sin espacios ni guiones. */
export function normalizePairingCode(input: string): string | null {
  const raw = input.trim().toUpperCase().replace(PAIRING_QR_PREFIX, '').replace(/[\s-]/g, '');
  if (raw.length !== CODE_LENGTH) return null;
  for (const char of raw) if (!CODE_ALPHABET.includes(char)) return null;
  return raw;
}

export const PAIRING_STATUSES = ['pending', 'approved', 'cancelled'] as const;

/**
 * `terminalPairingRequests/{sha256(código)}` (colección raíz: aún no hay negocio). El código no se
 * guarda: el id es su hash, así que solo quien vio el QR puede encontrar la solicitud.
 */
export const pairingRequestSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{64}$/),
  deviceUid: z.string().min(1),
  deviceUuid: z.uuid(),
  deviceType: z.enum(DEVICE_TYPES),
  status: z.enum(PAIRING_STATUSES),
  businessId: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
});
export type PairingRequest = z.infer<typeof pairingRequestSchema>;

export type PairingState = 'pending' | 'approved' | 'expired' | 'cancelled';

/** Vencimiento: hora del servidor de creación + 5 min (las reglas aplican el mismo límite). */
export function pairingExpiresAt(request: Pick<PairingRequest, 'createdAt'>): Date {
  return new Date(request.createdAt.getTime() + PAIRING_TTL_MS);
}

/** Estado visible: una solicitud pendiente vencida se muestra como expirada. */
export function pairingStateOf(
  request: Pick<PairingRequest, 'status' | 'createdAt'>,
  now: Date,
): PairingState {
  if (request.status !== 'pending') return request.status;
  return now >= pairingExpiresAt(request) ? 'expired' : 'pending';
}
