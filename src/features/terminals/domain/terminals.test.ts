import { describe, expect, it } from 'vitest';
import {
  generatePairingCode,
  normalizePairingCode,
  PAIRING_QR_PREFIX,
  pairingStateOf,
} from './pairing';
import { isIdle } from './session';
import { detectDeviceType, terminalStatusMachine } from './terminal';
import { maskEmail, selectableWorkers } from './worker';

const bytes = (values: number[]) => () => Uint8Array.from(values);

describe('código de vinculación', () => {
  it('genera 8 caracteres del alfabeto sin ambigüedades, con guion', () => {
    const code = generatePairingCode(bytes(Array.from({ length: 16 }, (_, i) => i * 7)));
    expect(code).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    expect(normalizePairingCode(code)).toBe(code.replace('-', ''));
  });

  it('normaliza lo escaneado o tecleado y rechaza códigos inválidos', () => {
    expect(normalizePairingCode(`${PAIRING_QR_PREFIX}ABCD-EFGH`)).toBe('ABCDEFGH');
    expect(normalizePairingCode(' abcd efgh ')).toBe('ABCDEFGH');
    expect(normalizePairingCode('ABCD-EFG0')).toBeNull();
    expect(normalizePairingCode('ABC')).toBeNull();
  });

  it('una solicitud pendiente vencida se ve expirada', () => {
    const createdAt = new Date('2026-11-06T10:00:00Z');
    expect(pairingStateOf({ status: 'pending', createdAt }, new Date('2026-11-06T10:04:59Z'))).toBe(
      'pending',
    );
    expect(pairingStateOf({ status: 'pending', createdAt }, new Date('2026-11-06T10:05:00Z'))).toBe(
      'expired',
    );
    expect(pairingStateOf({ status: 'approved', createdAt }, new Date('2026-11-07'))).toBe(
      'approved',
    );
  });
});

describe('terminales', () => {
  it('revocar es final; desactivar es reversible (L8)', () => {
    expect(terminalStatusMachine.canTransition('active', 'disabled')).toBe(true);
    expect(terminalStatusMachine.canTransition('disabled', 'active')).toBe(true);
    expect(terminalStatusMachine.canTransition('revoked', 'active')).toBe(false);
  });

  it.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 5, 'phone'],
    ['Mozilla/5.0 (Linux; Android 14; SM-X200)', 5, 'tablet'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile', 5, 'phone'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5, 'tablet'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0, 'desktop'],
    ['curl/8', 0, 'unknown'],
  ] as const)('%s → %s', (userAgent, maxTouchPoints, type) => {
    expect(detectDeviceType({ userAgent, maxTouchPoints })).toBe(type);
  });

  it('detecta inactividad', () => {
    expect(isIdle(0, 4 * 60_000, 5)).toBe(false);
    expect(isIdle(0, 5 * 60_000, 5)).toBe(true);
  });
});

describe('trabajadores del terminal', () => {
  it('solo muestra los habilitados, por nombre, con el email enmascarado', () => {
    const workers = selectableWorkers([
      { id: 'b', displayName: 'Rosa', email: 'rosa@x.co', role: 'admin', status: 'active' },
      { id: 'c', displayName: 'Ana', email: 'ana@x.co', role: 'employee', status: 'disabled' },
      { id: 'a', displayName: 'Carlos', email: 'carlos@x.co', role: 'custom', status: 'active' },
    ]);
    expect(workers.map((w) => w.id)).toEqual(['a', 'b']);
    expect(maskEmail('carlos@x.co')).toBe('c•••s@x.co');
    expect(maskEmail('al@x.co')).toBe('a•••@x.co');
  });
});
