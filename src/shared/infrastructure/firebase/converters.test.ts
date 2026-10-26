import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '@/shared/domain/errors';
import { timestampsToDates, zodConverter } from './converters';

const schema = z.object({
  id: z.string(),
  name: z.string(),
  at: z.date(),
  tags: z.array(z.object({ when: z.date() })),
});

function snapshot(data: Record<string, unknown>) {
  return { id: 'x1', ref: { path: 'col/x1' }, data: () => data } as never;
}

describe('zodConverter', () => {
  const converter = zodConverter(schema);
  const at = Timestamp.fromMillis(Date.UTC(2026, 0, 1));

  it('convierte Timestamps anidados a Date y añade el id', () => {
    const entity = converter.fromFirestore(snapshot({ name: 'A', at, tags: [{ when: at }] }));
    expect(entity).toEqual({ id: 'x1', name: 'A', at: at.toDate(), tags: [{ when: at.toDate() }] });
  });

  it('lanza AppError validation si el documento no cumple el esquema', () => {
    expect(() => converter.fromFirestore(snapshot({ name: 1 }))).toThrow(AppError);
  });

  it('no escribe el id dentro del documento', () => {
    expect(converter.toFirestore({ id: 'x1', name: 'A', at: new Date(0), tags: [] })).toEqual({
      name: 'A',
      at: new Date(0),
      tags: [],
    });
  });

  it('deja intactos los valores primitivos', () => {
    expect(timestampsToDates(null)).toBeNull();
    expect(timestampsToDates(3)).toBe(3);
  });
});
