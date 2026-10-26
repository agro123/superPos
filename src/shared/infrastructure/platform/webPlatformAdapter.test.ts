import { describe, expect, it, vi } from 'vitest';
import { createWebPlatformAdapter } from './webPlatformAdapter';

describe('webPlatformAdapter', () => {
  it('genera un código de dispositivo estable', () => {
    localStorage.clear();
    const adapter = createWebPlatformAdapter();
    const code = adapter.deviceCode();
    expect(code).toMatch(/^[A-Z0-9]{4}$/);
    expect(createWebPlatformAdapter().deviceCode()).toBe(code);
  });

  it('imprime el ticket como texto plano', async () => {
    const print = vi.fn();
    const append = vi.spyOn(document.body, 'append');
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue(
      Object.assign(document.implementation.createHTMLDocument().defaultView ?? window, { print }),
    );
    const result = await createWebPlatformAdapter().printReceipt({
      title: 'Ticket <b>1</b>',
      lines: [{ label: 'Café', value: '$ 3.500' }],
    });
    expect(result.ok).toBe(true);
    expect(print).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalled();
  });

  it('el cajón de dinero no está disponible en web', async () => {
    const result = await createWebPlatformAdapter().openCashDrawer();
    expect(result.ok ? null : result.error.code).toBe('unsupported');
  });
});
