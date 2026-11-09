import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';
import { defineStateMachine } from '@/shared/domain/stateMachine';

export const TABLE_STATUSES = ['free', 'occupied', 'reserved'] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

export const tableStatusMachine = defineStateMachine<TableStatus>('table', {
  free: ['occupied', 'reserved'],
  reserved: ['occupied', 'free'],
  occupied: ['free'],
});

export const ORDER_STATUSES = ['open', 'sent', 'served', 'paid', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Comanda: abierta → enviada a cocina → servida → pagada. Tras servir se puede enviar otra ronda
 * (servida → enviada); se cobra en cualquier momento activo y se cancela antes de servir (L8).
 */
export const orderStatusMachine = defineStateMachine<OrderStatus>('order', {
  open: ['sent', 'paid', 'cancelled'],
  sent: ['served', 'paid', 'cancelled'],
  served: ['sent', 'paid'],
  paid: [],
  cancelled: [],
});

/** `businesses/{bid}/restaurantZones/{id}`. */
export const zoneSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(40),
    sortOrder: z.number().int(),
  })
  .extend(auditFieldsSchema.shape);
export type Zone = z.infer<typeof zoneSchema>;

/** `businesses/{bid}/restaurantTables/{id}`. */
export const tableSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(20),
    zoneId: z.string().min(1),
    seats: z.number().int().min(1).max(50),
    status: z.enum(TABLE_STATUSES),
  })
  .extend(auditFieldsSchema.shape);
export type Table = z.infer<typeof tableSchema>;
