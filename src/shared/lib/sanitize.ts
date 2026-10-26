/**
 * Limpia texto que sale de la app (impresión de tickets, exportaciones): quita caracteres de
 * control, normaliza Unicode y limita la longitud. Nunca se interpreta como HTML.
 */
export function sanitizeText(text: string, maxLength = 200): string {
  return (
    text
      .normalize('NFC')
      // eslint-disable-next-line no-control-regex -- se eliminan justamente los caracteres de control
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '')
      .trim()
      .slice(0, maxLength)
  );
}
