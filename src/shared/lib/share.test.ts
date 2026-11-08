import { describe, expect, it } from 'vitest';
import { emailComposeUrl, normalizeWhatsapp, whatsappUrl, whatsappWebUrl } from './share';

describe('compartir', () => {
  it('normaliza números de WhatsApp', () => {
    expect(normalizeWhatsapp('300 123 4567')).toBe('573001234567');
    expect(normalizeWhatsapp('+57 (300) 123-4567')).toBe('573001234567');
    expect(normalizeWhatsapp('1234')).toBeNull();
  });

  it('arma enlaces de WhatsApp con el texto codificado', () => {
    expect(whatsappUrl('Hola & chao', '573001234567')).toBe(
      'https://wa.me/573001234567?text=Hola%20%26%20chao',
    );
    expect(whatsappUrl('Hola')).toBe('https://wa.me/?text=Hola');
    expect(whatsappWebUrl('Hola', '57300')).toContain(
      'web.whatsapp.com/send?text=Hola&phone=57300',
    );
  });

  it('redacta correos según el proveedor', () => {
    const draft = { to: 'a@b.co', subject: 'Catálogo', body: 'Mira: https://x.co/c/t' };
    expect(emailComposeUrl('app', draft)).toMatch(/^mailto:a%40b\.co\?subject=Cat%C3%A1logo&body=/);
    expect(emailComposeUrl('gmail', draft)).toContain(
      'mail.google.com/mail/?view=cm&fs=1&to=a%40b.co',
    );
    expect(emailComposeUrl('outlook', draft)).toContain('outlook.office.com/mail/deeplink/compose');
    expect(
      emailComposeUrl('custom', draft, 'https://correo.empresa.co/new?s={subject}&b={body}'),
    ).toBe(`https://correo.empresa.co/new?s=Cat%C3%A1logo&b=${encodeURIComponent(draft.body)}`);
    // Una plantilla insegura cae a la app de correo.
    expect(emailComposeUrl('custom', draft, 'javascript:alert(1)')).toMatch(/^mailto:/);
  });
});
