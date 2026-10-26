import { AppError } from '@/shared/domain/errors';
import { DEVICE_CODE_PATTERN } from '@/shared/domain/ids';
import { err, ok } from '@/shared/domain/result';
import { sanitizeText } from '@/shared/lib/sanitize';
import type { PlatformAdapter, ReceiptDocument } from './PlatformAdapter';

const DEVICE_KEY = 'superpos.deviceCode';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateDeviceCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

/** Construye el ticket con nodos de texto (sin innerHTML) dentro de un iframe aislado. */
function renderReceipt(doc: Document, receipt: ReceiptDocument): void {
  const style = doc.createElement('style');
  style.textContent =
    'body{font:12px monospace;width:72mm;margin:0 auto}p{display:flex;justify-content:space-between;margin:2px 0}h1{font-size:14px;text-align:center}';
  doc.head.append(style);
  const title = doc.createElement('h1');
  title.textContent = sanitizeText(receipt.title);
  doc.body.append(title);
  for (const line of receipt.lines) {
    const row = doc.createElement('p');
    const label = doc.createElement('span');
    const value = doc.createElement('span');
    label.textContent = sanitizeText(line.label, 60);
    value.textContent = sanitizeText(line.value, 30);
    row.append(label, value);
    doc.body.append(row);
  }
  if (receipt.footer) {
    const footer = doc.createElement('p');
    footer.textContent = sanitizeText(receipt.footer, 300);
    doc.body.append(footer);
  }
}

export function createWebPlatformAdapter(storage: Storage = window.localStorage): PlatformAdapter {
  return {
    kind: 'web',
    deviceCode() {
      const stored = storage.getItem(DEVICE_KEY);
      if (stored && DEVICE_CODE_PATTERN.test(stored)) return stored;
      const code = generateDeviceCode();
      storage.setItem(DEVICE_KEY, code);
      return code;
    },
    printReceipt(receipt) {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
      document.body.append(frame);
      const frameWindow = frame.contentWindow;
      if (!frameWindow) {
        frame.remove();
        return Promise.resolve(
          err(new AppError('unsupported', 'No se pudo preparar la impresión')),
        );
      }
      renderReceipt(frameWindow.document, receipt);
      frameWindow.print();
      frame.remove();
      return Promise.resolve(ok(undefined));
    },
    openCashDrawer() {
      return Promise.resolve(
        err(new AppError('unsupported', 'El cajón de dinero requiere la app de escritorio')),
      );
    },
  };
}
