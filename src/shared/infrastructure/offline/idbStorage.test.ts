import { describe, expect, it } from 'vitest';
import { idbStorage } from './idbStorage';

describe('idbStorage', () => {
  it('guarda, lee y borra valores', async () => {
    await idbStorage.setItem('cart', '{"lines":[]}');
    expect(await idbStorage.getItem('cart')).toBe('{"lines":[]}');
    await idbStorage.removeItem('cart');
    expect(await idbStorage.getItem('cart')).toBeNull();
  });
});
