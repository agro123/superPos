import { AppError } from '@/shared/domain/errors';
import { DEVICE_CODE_PATTERN } from '@/shared/domain/ids';

/**
 * Numeración local por dispositivo: `<deviceCode>-<secuencia de 6 dígitos>` (ADR 0006, propuesto).
 * Funciona sin conexión; la numeración fiscal consecutiva requerirá Cloud Functions.
 */
export function formatSaleNumber(deviceCode: string, sequence: number): string {
  if (!DEVICE_CODE_PATTERN.test(deviceCode)) {
    throw new AppError('validation', `Código de dispositivo inválido: ${deviceCode}`);
  }
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new AppError('validation', `Secuencia inválida: ${sequence}`);
  }
  return `${deviceCode}-${String(sequence).padStart(6, '0')}`;
}
