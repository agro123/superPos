import { toAppError } from '@/shared/domain/errors';
import { t } from './i18n';

/** Mensaje para el usuario según el código del error (nunca el mensaje técnico). */
export function errorMessage(error: unknown): string {
  return t(`errors.${toAppError(error).code}`);
}
