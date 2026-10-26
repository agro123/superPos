import { describe, expect, it } from 'vitest';
import { isValidTimeZone, startOfDayInZone, toIsoUtc } from './dates';
import { isValidEntityId } from './ids';

describe('dates', () => {
  it('serializa en ISO UTC', () => {
    expect(toIsoUtc(new Date(Date.UTC(2026, 0, 31, 15, 4, 5)))).toBe('2026-01-31T15:04:05.000Z');
  });

  it('valida zonas horarias IANA', () => {
    expect(isValidTimeZone('America/Bogota')).toBe(true);
    expect(isValidTimeZone('Marte/Olympus')).toBe(false);
  });

  it('calcula el inicio del día en la zona del negocio', () => {
    // 2026-03-10 02:30 UTC = 2026-03-09 21:30 en Bogotá (UTC−5)
    const instant = new Date(Date.UTC(2026, 2, 10, 2, 30));
    expect(startOfDayInZone(instant, 'America/Bogota').toISOString()).toBe(
      '2026-03-09T05:00:00.000Z',
    );
  });
});

describe('ids', () => {
  it('acepta ids de Firestore y rechaza rutas', () => {
    expect(isValidEntityId('aB3_-x')).toBe(true);
    expect(isValidEntityId('a/b')).toBe(false);
    expect(isValidEntityId('')).toBe(false);
  });
});
