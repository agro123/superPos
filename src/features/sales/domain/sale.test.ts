import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/domain/errors';
import { money } from '@/shared/domain/money';
import { saleStatusMachine, voidedSaleIds, type Sale, type SaleLine } from './sale';
import { formatSaleNumber } from './saleNumber';
import { stockDecrementsFor } from './stock';

const line = (productId: string, quantity: number, voided = false): SaleLine => ({
  productId,
  name: productId,
  unitPriceMinor: money(100),
  quantity,
  taxRateBps: 0,
  discountMinor: money(0),
  voided,
});

describe('saleStatusMachine (L8)', () => {
  it('una venta completada no cambia de estado', () => {
    expect(saleStatusMachine.isTerminal('completed')).toBe(true);
    expect(saleStatusMachine.canTransition('completed', 'cancelled')).toBe(false);
  });

  it('el cobro puede volver al borrador o completarse', () => {
    expect(saleStatusMachine.canTransition('draft', 'awaiting_payment')).toBe(true);
    expect(saleStatusMachine.canTransition('awaiting_payment', 'draft')).toBe(true);
    expect(saleStatusMachine.canTransition('draft', 'completed')).toBe(false);
  });
});

describe('formatSaleNumber', () => {
  it('compone dispositivo y secuencia', () => {
    expect(formatSaleNumber('CAJA1', 42)).toBe('CAJA1-000042');
  });

  it('valida código y secuencia', () => {
    expect(() => formatSaleNumber('x', 1)).toThrow(AppError);
    expect(() => formatSaleNumber('A1', 0)).toThrow(AppError);
  });
});

describe('stockDecrementsFor (L1)', () => {
  it('agrupa por producto y omite anuladas y productos sin control de stock', () => {
    const lines = [line('a', 2), line('a', 1), line('b', 5, true), line('c', 1)];
    expect(stockDecrementsFor(lines, (id) => id !== 'c')).toEqual([
      { productId: 'a', quantity: 3 },
    ]);
  });
});

describe('voidedSaleIds', () => {
  it('encuentra las ventas anuladas por documentos void', () => {
    const sales = [
      { type: 'sale', voidedSaleId: null },
      { type: 'void', voidedSaleId: 's1' },
    ] as Sale[];
    expect([...voidedSaleIds(sales)]).toEqual(['s1']);
  });
});
