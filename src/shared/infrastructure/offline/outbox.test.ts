import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backoffDelay, Outbox } from './outbox';

let clock = 0;
let dbIndex = 0;
const createOutbox = (onChange = vi.fn()) =>
  new Outbox({
    dbName: `outbox-test-${++dbIndex}`,
    now: () => clock,
    baseDelayMs: 1000,
    maxDelayMs: 8000,
    maxAttempts: 3,
    onChange,
  });

describe('Outbox', () => {
  beforeEach(() => {
    clock = 0;
  });

  it('encola y procesa operaciones en orden', async () => {
    const outbox = createOutbox();
    const calls: string[] = [];
    outbox.registerHandler('upload', (payload) => {
      calls.push(String(payload));
      return Promise.resolve();
    });
    await outbox.enqueue('upload', 'a', 'op-1');
    clock = 1;
    await outbox.enqueue('upload', 'b', 'op-2');
    await outbox.processDue();
    expect(calls).toEqual(['a', 'b']);
    expect(await outbox.stats()).toEqual({ pending: 0, failed: 0 });
  });

  it('es idempotente por operationId', async () => {
    const outbox = createOutbox();
    expect((await outbox.enqueue('upload', 'a', 'op-1')).duplicate).toBe(false);
    expect((await outbox.enqueue('upload', 'otro', 'op-1')).duplicate).toBe(true);
    expect(await outbox.list()).toHaveLength(1);
    expect((await outbox.list())[0]?.payload).toBe('a');
  });

  it('reintenta con backoff exponencial y marca como fallida al agotar intentos', async () => {
    const onChange = vi.fn();
    const outbox = createOutbox(onChange);
    const handler = vi.fn().mockRejectedValue(new Error('sin red'));
    outbox.registerHandler('upload', handler);
    await outbox.enqueue('upload', 'a', 'op-1');

    await outbox.processDue();
    expect((await outbox.list())[0]).toMatchObject({
      attempts: 1,
      status: 'pending',
      nextAttemptAt: 1000,
    });

    await outbox.processDue(); // todavía no vence
    expect(handler).toHaveBeenCalledTimes(1);

    clock = 1000;
    await outbox.processDue();
    expect((await outbox.list())[0]).toMatchObject({ attempts: 2, nextAttemptAt: 3000 });

    clock = 3000;
    await outbox.processDue();
    expect((await outbox.list())[0]).toMatchObject({
      attempts: 3,
      status: 'failed',
      lastError: 'unknown',
    });
    expect(onChange).toHaveBeenLastCalledWith({ pending: 0, failed: 1 });

    handler.mockResolvedValue(undefined);
    await outbox.retryFailed();
    await outbox.processDue();
    expect(await outbox.stats()).toEqual({ pending: 0, failed: 0 });
  });

  it('deja en cola las operaciones sin handler registrado', async () => {
    const outbox = createOutbox();
    await outbox.enqueue('desconocida', {}, 'op-1');
    await outbox.processDue();
    expect(await outbox.stats()).toEqual({ pending: 1, failed: 0 });
  });

  it('no procesa dos veces en paralelo', async () => {
    const outbox = createOutbox();
    const handler = vi.fn().mockResolvedValue(undefined);
    outbox.registerHandler('upload', handler);
    await outbox.enqueue('upload', 'a', 'op-1');
    await Promise.all([outbox.processDue(), outbox.processDue()]);
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('backoffDelay', () => {
  it('duplica el retraso hasta el máximo', () => {
    expect([1, 2, 3, 4, 5].map((n) => backoffDelay(n, 1000, 8000))).toEqual([
      1000, 2000, 4000, 8000, 8000,
    ]);
  });
});
