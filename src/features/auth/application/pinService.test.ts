import { describe, expect, it } from 'vitest';
import type { PinHasher, PinRecord, PinStore } from '../domain/pin';
import { createPinService } from './pinService';

function memoryStore(): PinStore {
  const records = new Map<string, PinRecord>();
  return {
    get: (uid) => Promise.resolve(records.get(uid) ?? null),
    set: (uid, record) => {
      records.set(uid, record);
      return Promise.resolve();
    },
    remove: (uid) => {
      records.delete(uid);
      return Promise.resolve();
    },
  };
}

const fakeHasher: PinHasher = {
  derive: (pin) =>
    Promise.resolve({ algorithm: 'PBKDF2-SHA256', iterations: 1, salt: 's', hash: `h(${pin})` }),
  verify: (pin, credential) => Promise.resolve(credential.hash === `h(${pin})`),
};

describe('pinService', () => {
  it('rechaza PINs débiles y guarda solo la credencial derivada', async () => {
    const store = memoryStore();
    const service = createPinService(store, fakeHasher);
    expect((await service.setPin('u1', '1234')).ok).toBe(false);
    expect((await service.setPin('u1', '2580')).ok).toBe(true);
    expect(await service.hasPin('u1')).toBe(true);
    expect(JSON.stringify(await store.get('u1'))).not.toContain('"2580"');
  });

  it('verifica y bloquea tras 5 intentos fallidos', async () => {
    let clock = 0;
    const service = createPinService(memoryStore(), fakeHasher, () => clock);
    await service.setPin('u1', '2580');
    for (let i = 0; i < 4; i += 1) {
      const result = await service.verify('u1', '0000');
      expect(result.ok ? null : result.error.code).toBe('unauthenticated');
    }
    const fifth = await service.verify('u1', '0000');
    expect(fifth.ok ? null : fifth.error.code).toBe('locked');
    const whileLocked = await service.verify('u1', '2580');
    expect(whileLocked.ok ? null : whileLocked.error.code).toBe('locked');
    clock = 30_000;
    expect((await service.verify('u1', '2580')).ok).toBe(true);
  });

  it('sin PIN configurado responde not_found', async () => {
    const service = createPinService(memoryStore(), fakeHasher);
    const result = await service.verify('nadie', '2580');
    expect(result.ok ? null : result.error.code).toBe('not_found');
    await service.removePin('nadie');
  });
});
