import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { addMoney, multiplyMoney, ZERO_MONEY, type Money } from '@/shared/domain/money';
import { moneySchema, optionalText, rateBpsSchema } from '@/shared/domain/schemas';
import { ORDER_STATUSES, type OrderStatus } from './restaurant';

/** Línea de comanda: snapshot del producto (precio del catálogo, L6) y si ya fue a cocina. */
export const orderLineSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  name: z.string().min(1).max(120),
  unitPriceMinor: moneySchema,
  taxRateBps: rateBpsSchema,
  quantity: z.number().int().positive().max(99),
  notes: optionalText(120),
  /** Ronda de cocina en la que salió (0 = aún no enviada). */
  round: z.number().int().min(0),
});
export type OrderLine = z.infer<typeof orderLineSchema>;

/** `businesses/{bid}/restaurantOrders/{id}`: comanda de una mesa. */
export const restaurantOrderSchema = z
  .object({
    id: z.string().min(1),
    tableId: z.string().min(1),
    tableName: z.string().min(1),
    status: z.enum(ORDER_STATUSES),
    guests: z.number().int().min(1).max(50),
    lines: z.array(orderLineSchema).max(100),
    /** Última ronda enviada a cocina. */
    round: z.number().int().min(0),
    notes: optionalText(200),
    saleId: z.string().nullable(),
    openedAt: z.date(),
    sentAt: z.date().nullable(),
    servedAt: z.date().nullable(),
    closedAt: z.date().nullable(),
  })
  .extend(auditFieldsSchema.shape);
export type RestaurantOrder = z.infer<typeof restaurantOrderSchema>;

export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = ['open', 'sent', 'served'];
export const isActiveOrder = (order: Pick<RestaurantOrder, 'status'>) =>
  ACTIVE_ORDER_STATUSES.includes(order.status);

export interface OrderProduct {
  id: string;
  name: string;
  priceMinor: Money;
  taxRateBps: number;
}

/**
 * Agrega un producto: suma a una línea pendiente igual (mismo producto y nota) o crea otra. Las
 * líneas ya enviadas a cocina no se tocan (quedan en su ronda).
 */
export function addOrderLine(
  lines: readonly OrderLine[],
  product: OrderProduct,
  newId: string,
  notes: string | null = null,
): OrderLine[] {
  const same = lines.find((l) => l.round === 0 && l.productId === product.id && l.notes === notes);
  if (same)
    return lines.map((l) => (l === same ? { ...l, quantity: Math.min(99, l.quantity + 1) } : l));
  return [
    ...lines,
    {
      id: newId,
      productId: product.id,
      name: product.name,
      unitPriceMinor: product.priceMinor,
      taxRateBps: product.taxRateBps,
      quantity: 1,
      notes,
      round: 0,
    },
  ];
}

/** Cambia la cantidad de una línea pendiente (0 la quita). Las enviadas no se modifican. */
export function setPendingQuantity(
  lines: readonly OrderLine[],
  lineId: string,
  quantity: number,
): OrderLine[] {
  return lines
    .map((l) => (l.id === lineId && l.round === 0 ? { ...l, quantity: Math.min(99, quantity) } : l))
    .filter((l) => l.round > 0 || l.quantity > 0);
}

export const pendingLines = (lines: readonly OrderLine[]) => lines.filter((l) => l.round === 0);

/** Envía a cocina las líneas pendientes como una nueva ronda. `null` si no hay nada que enviar. */
export function sendRound(
  order: Pick<RestaurantOrder, 'lines' | 'round'>,
): { lines: OrderLine[]; round: number } | null {
  if (pendingLines(order.lines).length === 0) return null;
  const round = order.round + 1;
  return { round, lines: order.lines.map((l) => (l.round === 0 ? { ...l, round } : l)) };
}

/** Total de la comanda a precios del catálogo (sin impuestos discriminados: eso lo hace el cobro). */
export const orderTotal = (lines: readonly OrderLine[]): Money =>
  lines.reduce((sum, l) => addMoney(sum, multiplyMoney(l.unitPriceMinor, l.quantity)), ZERO_MONEY);

/** Minutos transcurridos (para el tablero de mesas y la cocina). */
export const minutesSince = (from: Date, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - from.getTime()) / 60_000));
