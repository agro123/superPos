import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import type { CashShift, ShiftSale } from './cashShift';
import { cashByWorker, shiftMovements } from './movements';

const at = (minute: number) => new Date(Date.UTC(2026, 10, 1, 10, minute));
const audit = { createdAt: at(0), updatedAt: at(0), createdBy: 'ana', schemaVersion: 1 };
const shift: CashShift = {
  id: 'sh1',
  status: 'closed',
  deviceCode: 'C1',
  openedBy: 'ana',
  openedAt: at(0),
  openingFloatMinor: money(50000),
  closedBy: 'rosa',
  closedAt: at(59),
  countedCashMinor: money(59000),
  expectedCashMinor: money(60000),
  notes: null,
  ...audit,
};
const sale = (id: string, by: string, minute: number, cash: number, change = 0): ShiftSale => ({
  id,
  type: 'sale',
  number: id,
  voidedSaleId: null,
  cashShiftId: 'sh1',
  payments: [{ method: 'cash', amountMinor: money(cash) }],
  changeMinor: money(change),
  createdBy: by,
  occurredAt: at(minute),
});

describe('movimientos de caja por trabajador', () => {
  const movements = shiftMovements({
    shift,
    sales: [
      sale('s1', 'ana', 5, 20000, 2000),
      sale('s2', 'carlos', 10, 8000),
      sale('s3', 'carlos', 15, 99999),
      { ...sale('void-s3', 'rosa', 20, 99999), type: 'void', voidedSaleId: 's3' },
    ],
    expenses: [
      {
        id: 'e1',
        amountMinor: money(3000),
        description: 'Hielo',
        ...audit,
        createdBy: 'carlos',
        createdAt: at(30),
      },
    ],
    creditPayments: [
      {
        id: 'p1',
        customerId: 'cu1',
        amountMinor: money(5000),
        method: 'cash',
        cashShiftId: 'sh1',
        createdBy: 'ana',
        occurredAt: at(40),
      },
    ],
  });

  it('ordena la línea de tiempo y atribuye cada movimiento', () => {
    expect(movements.map((m) => `${m.kind}:${m.by}`)).toEqual([
      'open:ana',
      'sale:ana',
      'sale:carlos',
      'sale:carlos',
      'void:rosa',
      'expense:carlos',
      'creditPayment:ana',
      'close:rosa',
    ]);
    expect(movements.find((m) => m.id === 's3')?.voided).toBe(true);
    expect(movements.at(-1)?.difference).toBe(-1000);
  });

  it('totaliza por trabajador sin sumar ventas anuladas', () => {
    const rows = new Map(cashByWorker(movements).map((r) => [r.uid, r]));
    expect(rows.get('ana')).toMatchObject({
      shiftsOpened: 1,
      salesCount: 1,
      cashIn: 25000,
      changeGiven: 2000,
      creditCollected: 5000,
    });
    expect(rows.get('carlos')).toMatchObject({ salesCount: 1, cashIn: 8000, expenses: 3000 });
    expect(rows.get('rosa')).toMatchObject({ shiftsClosed: 1, voidsCount: 1, difference: -1000 });
  });
});
