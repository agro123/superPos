/** Proveedor de correo con el que el negocio prefiere redactar (configurable por el admin). */
export type EmailProvider = 'app' | 'gmail' | 'outlook' | 'custom';

export interface EmailDraft {
  to?: string;
  subject: string;
  body: string;
}

/**
 * Solo dígitos, con indicativo de país (formato de wa.me). Un número local de 10 dígitos que
 * empieza por 3 se toma como celular colombiano (+57). Devuelve `null` si no es plausible.
 */
export function normalizeWhatsapp(input: string, defaultCountry = '57'): string | null {
  const digits = input.replace(/\D/g, '');
  const full =
    digits.length === 10 && digits.startsWith('3') ? `${defaultCountry}${digits}` : digits;
  return full.length >= 8 && full.length <= 15 ? full : null;
}

/**
 * Enlace de WhatsApp. `wa.me` abre la app si está instalada y, si no, WhatsApp Web en el
 * navegador. Sin número, deja elegir el chat (compartir).
 */
export function whatsappUrl(text: string, phone?: string | null): string {
  const target = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
  return `${target}?text=${encodeURIComponent(text)}`;
}

/** Forzar WhatsApp Web (útil en un computador sin la app). */
export function whatsappWebUrl(text: string, phone?: string | null): string {
  const params = new URLSearchParams({ text, ...(phone ? { phone } : {}) });
  return `https://web.whatsapp.com/send?${params.toString()}`;
}

/**
 * Enlace para redactar un correo. `app` usa `mailto:` (app de correo del dispositivo); Gmail y
 * Outlook abren su redactor web; `custom` reemplaza `{to}`, `{subject}` y `{body}` en la plantilla
 * que configuró el admin (debe ser `https://`).
 */
export function emailComposeUrl(
  provider: EmailProvider,
  draft: EmailDraft,
  customTemplate?: string | null,
): string {
  const to = draft.to ?? '';
  const enc = encodeURIComponent;
  switch (provider) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(draft.subject)}&body=${enc(draft.body)}`;
    case 'outlook':
      return `https://outlook.office.com/mail/deeplink/compose?to=${enc(to)}&subject=${enc(draft.subject)}&body=${enc(draft.body)}`;
    case 'custom':
      if (customTemplate?.startsWith('https://')) {
        return customTemplate
          .replaceAll('{to}', enc(to))
          .replaceAll('{subject}', enc(draft.subject))
          .replaceAll('{body}', enc(draft.body));
      }
      return emailComposeUrl('app', draft);
    case 'app':
      return `mailto:${enc(to)}?subject=${enc(draft.subject)}&body=${enc(draft.body)}`;
  }
}
