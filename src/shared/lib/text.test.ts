import { describe, expect, it } from 'vitest';
import { initialsOf } from './text';

describe('initialsOf', () => {
  it('toma la primera y la última palabra', () => {
    expect(initialsOf('Ana María Ríos')).toBe('AR');
    expect(initialsOf('carlos')).toBe('C');
    expect(initialsOf('  ')).toBe('');
  });
});
