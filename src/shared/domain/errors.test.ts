import { describe, expect, it } from 'vitest';
import { AppError, isAppError, toAppError } from './errors';
import { err, ok } from './result';

describe('AppError', () => {
  it('conserva code, details y cause', () => {
    const cause = new Error('raíz');
    const error = new AppError('not_found', 'No existe', { cause, details: { id: 'x' } });
    expect(error.code).toBe('not_found');
    expect(error.details).toEqual({ id: 'x' });
    expect(error.cause).toBe(cause);
    expect(new AppError('offline').message).toBe('offline');
  });

  it('toAppError normaliza cualquier valor', () => {
    const original = new AppError('conflict');
    expect(toAppError(original)).toBe(original);
    expect(toAppError(new Error('boom'))).toMatchObject({ code: 'unknown', message: 'boom' });
    expect(toAppError('texto').code).toBe('unknown');
    expect(isAppError({ code: 'unknown' })).toBe(false);
  });
});

describe('Result', () => {
  it('construye resultados ok y err', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err('x')).toEqual({ ok: false, error: 'x' });
  });
});
