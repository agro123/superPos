import { messages } from './messages';

/** Locale por defecto de la aplicación (español de Colombia). */
export const DEFAULT_LOCALE = 'es-CO';

export type MessageKey = keyof typeof messages;
export type MessageParams = Readonly<Record<string, string | number>>;

/** Elige la forma singular o plural según `count` (es-CO: singular solo para 1). */
export function plural(
  count: number,
  one: MessageKey,
  other: MessageKey,
  params?: MessageParams,
): string {
  return count === 1 ? t(one, params) : t(other, { count, ...params });
}

/**
 * Traduce una clave de mensaje e interpola `{param}`.
 * Las claves están tipadas: una clave inexistente es un error de compilación.
 */
export function t(key: MessageKey, params?: MessageParams): string {
  const template: string = messages[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
