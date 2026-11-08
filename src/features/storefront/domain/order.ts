import { addMoney, multiplyMoney, ZERO_MONEY, type Money } from '@/shared/domain/money';

export interface OrderLine {
  name: string;
  quantity: number;
  priceMinor: Money;
}

export interface OrderContact {
  name: string;
  address: string;
  notes: string;
}

export const orderTotal = (lines: readonly OrderLine[]): Money =>
  lines.reduce(
    (sum, line) => addMoney(sum, multiplyMoney(line.priceMinor, line.quantity)),
    ZERO_MONEY,
  );

/**
 * Mensaje de pedido a domicilio que el cliente envía desde su WhatsApp al número de la tienda.
 * El pedido no se registra en el sistema: lo confirma y cobra la tienda (precios orientativos).
 */
export function deliveryOrderMessage(
  storeName: string,
  lines: readonly OrderLine[],
  contact: OrderContact,
  formatMoney: (amount: Money) => string,
): string {
  const items = lines.map(
    (line) =>
      `• ${String(line.quantity)} × ${line.name} (${formatMoney(multiplyMoney(line.priceMinor, line.quantity))})`,
  );
  const extra = [
    contact.name.trim() ? `Nombre: ${contact.name.trim()}` : null,
    contact.address.trim() ? `Dirección: ${contact.address.trim()}` : null,
    contact.notes.trim() ? `Notas: ${contact.notes.trim()}` : null,
  ].filter((line) => line !== null);
  return [
    `Hola ${storeName}, quiero pedir a domicilio:`,
    '',
    ...items,
    '',
    `Total aproximado: ${formatMoney(orderTotal(lines))}`,
    ...(extra.length > 0 ? ['', ...extra] : []),
  ].join('\n');
}

/** Texto para compartir el catálogo (WhatsApp o correo). */
export function shareCatalogText(
  title: string,
  url: string,
  highlights: readonly string[],
): string {
  const top = highlights.slice(0, 5).map((name) => `• ${name}`);
  return [
    `Mira el catálogo de ${title}: ${url}`,
    ...(top.length > 0 ? ['', 'Algunos productos:', ...top] : []),
    '',
    'Puedes pedir a domicilio por WhatsApp desde el catálogo.',
  ].join('\n');
}
