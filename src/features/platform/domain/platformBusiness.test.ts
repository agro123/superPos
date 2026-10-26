import { describe, expect, it } from 'vitest';
import { businessStatusMachine } from '@/features/business';
import {
  filterByStatus,
  platformBusinessInputSchema,
  summarize,
  totalRecords,
  USAGE_COLLECTIONS,
  type UsageCounts,
} from './platformBusiness';

describe('ciclo de vida del negocio', () => {
  it('permite bloquear, desbloquear, eliminar y restaurar', () => {
    expect(businessStatusMachine.canTransition('active', 'blocked')).toBe(true);
    expect(businessStatusMachine.canTransition('blocked', 'active')).toBe(true);
    expect(businessStatusMachine.canTransition('blocked', 'deleted')).toBe(true);
    expect(businessStatusMachine.canTransition('deleted', 'active')).toBe(true);
  });

  it('un eliminado no pasa directo a bloqueado', () => {
    expect(() => {
      businessStatusMachine.assertTransition('deleted', 'blocked');
    }).toThrow();
  });
});

describe('alta desde la plataforma', () => {
  const valid = {
    name: 'Panadería Sol',
    type: 'cafe',
    currency: 'COP',
    timezone: 'America/Bogota',
    plan: 'free',
    ownerEmail: '  Duena@Example.CO ',
  };

  it('normaliza el email del dueño', () => {
    expect(platformBusinessInputSchema.parse(valid).ownerEmail).toBe('duena@example.co');
  });

  it('rechaza planes desconocidos y emails inválidos', () => {
    expect(platformBusinessInputSchema.safeParse({ ...valid, plan: 'gold' }).success).toBe(false);
    expect(platformBusinessInputSchema.safeParse({ ...valid, ownerEmail: 'x' }).success).toBe(
      false,
    );
  });
});

describe('uso y resumen', () => {
  it('suma los registros de todas las colecciones', () => {
    const counts = Object.fromEntries(USAGE_COLLECTIONS.map((c) => [c, 2])) as UsageCounts;
    expect(totalRecords(counts)).toBe(USAGE_COLLECTIONS.length * 2);
  });

  const businesses = [
    { plan: 'premium', status: 'active' },
    { plan: 'free', status: 'blocked' },
    { plan: 'premium', status: 'deleted' },
  ] as const;

  it('el filtro "todos" oculta los eliminados', () => {
    expect(filterByStatus(businesses, 'all')).toHaveLength(2);
    expect(filterByStatus(businesses, 'deleted')).toHaveLength(1);
  });

  it('el resumen no cuenta eliminados', () => {
    expect(summarize(businesses)).toEqual({ total: 2, premium: 1, blocked: 1 });
  });
});
