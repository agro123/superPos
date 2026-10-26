// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createWebCryptoPinHasher } from './webCryptoPinHasher';

describe('webCryptoPinHasher (L2)', () => {
  const hasher = createWebCryptoPinHasher(1_000);

  it('nunca guarda el PIN en claro y usa sal aleatoria por credencial', async () => {
    const first = await hasher.derive('2580');
    const second = await hasher.derive('2580');
    expect(JSON.stringify(first)).not.toContain('2580');
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    expect(first).toMatchObject({ algorithm: 'PBKDF2-SHA256', iterations: 1_000 });
  });

  it('verifica el PIN correcto y rechaza el incorrecto', async () => {
    const credential = await hasher.derive('2580');
    expect(await hasher.verify('2580', credential)).toBe(true);
    expect(await hasher.verify('2581', credential)).toBe(false);
  });
});
