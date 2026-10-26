import { describe, expect, it } from 'vitest';
import { customerInputSchema } from './customer';

describe('customerInputSchema', () => {
  it('normaliza campos vacíos a null', () => {
    expect(
      customerInputSchema.parse({
        name: ' Ana ',
        documentId: '',
        phone: null,
        email: '',
        notes: '',
      }),
    ).toEqual({ name: 'Ana', documentId: null, phone: null, email: null, notes: null });
  });

  it('valida el email cuando se escribe', () => {
    expect(
      customerInputSchema.safeParse({
        name: 'Ana',
        documentId: null,
        phone: null,
        email: 'x',
        notes: null,
      }).success,
    ).toBe(false);
  });
});
