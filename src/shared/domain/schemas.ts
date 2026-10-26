import { z } from 'zod';
import { money } from './money';

/** `Money` persistido: entero no negativo en unidad mínima, tipado como `Money` al leer. */
export const moneySchema = z
  .number()
  .int()
  .nonnegative()
  .transform((value) => money(value));

/** Tasa en puntos básicos (0–10 000). */
export const rateBpsSchema = z.number().int().min(0).max(10_000);

/** Texto opcional normalizado: vacío → `null`. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value === '' ? null : value));
