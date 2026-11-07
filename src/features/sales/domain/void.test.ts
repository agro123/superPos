import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import type { Sale } from './sale';
import { buildVoid, voidIdFor } from './void';

const sale: Sale = {
  id: 's1',
  type: 'sale',
  number: 'CAJA1-000001',
  deviceCode: 'CAJA1',
  lines: [
    {
      productId: 'p1',
      name: 'Café',
      unitPriceMinor: money(3000),
      quantity: 2,
      taxRateBps: 0,
      discountMinor: money(0),
      voided: false,
    },
  ],
  subtotalMinor: money(6000),
  discountMinor: money(0),
  taxMinor: money(0),
  totalMinor: money(6000),
  payments: [{ method: 'credit', amountMinor: money(6000), status: 'captured', reference: null }],
  changeMinor: money(0),
  creditMinor: money(6000),
  customerId: 'cu1',
  cashShiftId: 'shift1',
  terminalId: null,
  voidedSaleId: null,
  voidReason: null,
  occurredAt: new Date('2026-11-01T10:00:00Z'),
  createdAt: new Date('2026-11-01T10:00:00Z'),
  updatedAt: new Date('2026-11-01T10:00:00Z'),
  createdBy: 'emp',
  schemaVersion: 1,
};

describe('buildVoid', () => {
  it('crea el documento void con id determinista, el mismo turno y la devolución de stock', () => {
    const result = buildVoid({
      sale: { ...sale, pendingSync: true } as Sale,
      reason: '  Cliente devolvió  ',
      deviceCode: 'CAJA2',
      terminalId: 'term2',
      occurredAt: new Date('2026-11-01T11:00:00Z'),
      tracksStock: () => true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.voidSale).toMatchObject({
      id: voidIdFor('s1'),
      type: 'void',
      voidedSaleId: 's1',
      voidReason: 'Cliente devolvió',
      cashShiftId: 'shift1',
      terminalId: 'term2',
      creditMinor: 6000,
      customerId: 'cu1',
    });
    expect(result.value.voidSale).not.toHaveProperty('pendingSync');
    expect(result.value.voidSale).not.toHaveProperty('createdBy');
    expect(result.value.restock).toEqual([{ productId: 'p1', quantity: 2 }]);
  });

  it('exige motivo y no anula una anulación', () => {
    const base = {
      deviceCode: 'C1',
      terminalId: null,
      occurredAt: new Date(),
      tracksStock: () => false,
    };
    expect(buildVoid({ ...base, sale, reason: ' ' }).ok).toBe(false);
    expect(buildVoid({ ...base, sale: { ...sale, type: 'void' }, reason: 'error' }).ok).toBe(false);
  });
});
