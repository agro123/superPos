import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { toAppError } from '@/shared/domain/errors';

/**
 * Outbox propio para lo que Firestore no encola (subidas a Storage, pagos, Cloud Functions).
 * Persistido en IndexedDB, con reintentos, backoff exponencial e idempotencia por `operationId`.
 * Ver docs/architecture/offline-sync.md.
 */
export interface OutboxOperation {
  operationId: string;
  type: string;
  payload: unknown;
  status: 'pending' | 'failed';
  attempts: number;
  /** Epoch ms del próximo intento. */
  nextAttemptAt: number;
  lastError: string | null;
  createdAt: number;
}

/** Ejecuta una operación. Debe ser idempotente: puede repetirse tras un fallo parcial. */
export type OutboxHandler = (payload: unknown, operationId: string) => Promise<void>;

export interface OutboxStats {
  pending: number;
  failed: number;
}

export interface OutboxOptions {
  dbName?: string;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  now?: () => number;
  onChange?: (stats: OutboxStats) => void;
}

interface OutboxDb extends DBSchema {
  operations: { key: string; value: OutboxOperation; indexes: { byStatus: string } };
}

/** Retraso exponencial: base, 2×base, 4×base… acotado a `max`. */
export function backoffDelay(attempts: number, baseMs: number, maxMs: number): number {
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, attempts - 1));
}

export class Outbox {
  private readonly handlers = new Map<string, OutboxHandler>();
  private readonly db: Promise<IDBPDatabase<OutboxDb>>;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly now: () => number;
  private readonly onChange: ((stats: OutboxStats) => void) | undefined;
  private running: Promise<void> | null = null;

  constructor(options: OutboxOptions = {}) {
    this.db = openDB<OutboxDb>(options.dbName ?? 'superpos-outbox', 1, {
      upgrade(db) {
        db.createObjectStore('operations', { keyPath: 'operationId' }).createIndex(
          'byStatus',
          'status',
        );
      },
    });
    this.maxAttempts = options.maxAttempts ?? 8;
    this.baseDelayMs = options.baseDelayMs ?? 2_000;
    this.maxDelayMs = options.maxDelayMs ?? 5 * 60_000;
    this.now = options.now ?? Date.now;
    this.onChange = options.onChange;
  }

  /** Registra (o reemplaza) el handler de un tipo de operación. */
  registerHandler(type: string, handler: OutboxHandler): void {
    this.handlers.set(type, handler);
  }

  /** Encola una operación. Si el `operationId` ya existe no hace nada (idempotencia). */
  async enqueue(
    type: string,
    payload: unknown,
    operationId: string = crypto.randomUUID(),
  ): Promise<{ operationId: string; duplicate: boolean }> {
    const db = await this.db;
    const tx = db.transaction('operations', 'readwrite');
    const duplicate = (await tx.store.get(operationId)) !== undefined;
    if (!duplicate) {
      await tx.store.add({
        operationId,
        type,
        payload,
        status: 'pending',
        attempts: 0,
        nextAttemptAt: this.now(),
        lastError: null,
        createdAt: this.now(),
      });
    }
    await tx.done;
    await this.notify();
    return { operationId, duplicate };
  }

  /** Procesa las operaciones vencidas, en orden de creación. Nunca corre dos veces en paralelo. */
  processDue(): Promise<void> {
    this.running ??= this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** Vuelve a poner en cola las operaciones que agotaron sus reintentos. */
  async retryFailed(): Promise<void> {
    const db = await this.db;
    for (const operation of await db.getAllFromIndex('operations', 'byStatus', 'failed')) {
      await db.put('operations', {
        ...operation,
        status: 'pending',
        attempts: 0,
        nextAttemptAt: this.now(),
      });
    }
    await this.notify();
  }

  async list(): Promise<OutboxOperation[]> {
    const operations = await (await this.db).getAll('operations');
    return operations.sort((a, b) => a.createdAt - b.createdAt);
  }

  async stats(): Promise<OutboxStats> {
    const db = await this.db;
    return {
      pending: await db.countFromIndex('operations', 'byStatus', 'pending'),
      failed: await db.countFromIndex('operations', 'byStatus', 'failed'),
    };
  }

  private async run(): Promise<void> {
    const db = await this.db;
    const due = (await this.list()).filter(
      (op) =>
        op.status === 'pending' && op.nextAttemptAt <= this.now() && this.handlers.has(op.type),
    );
    for (const operation of due) {
      const handler = this.handlers.get(operation.type);
      if (!handler) continue;
      try {
        await handler(operation.payload, operation.operationId);
        await db.delete('operations', operation.operationId);
      } catch (error) {
        const attempts = operation.attempts + 1;
        await db.put('operations', {
          ...operation,
          attempts,
          status: attempts >= this.maxAttempts ? 'failed' : 'pending',
          nextAttemptAt: this.now() + backoffDelay(attempts, this.baseDelayMs, this.maxDelayMs),
          lastError: toAppError(error).code,
        });
      }
    }
    await this.notify();
  }

  private async notify(): Promise<void> {
    if (this.onChange) this.onChange(await this.stats());
  }
}
