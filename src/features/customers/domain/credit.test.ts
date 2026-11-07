import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import { balanceOf, customerBalances, type CreditSale } from './credit';

const sale = (id: string, customerId: string, credit: number, day = 1): CreditSale => ({
  id,
  type: 'sale',
  number: id,
  voidedSaleId: null,
  customerId,
  creditMinor: money(credit),
  occurredAt: new Date(Date.UTC(2026, 10, day)),
});

describe('saldos de clientes (fiado)', () => {
  it('suma lo fiado, resta abonos y excluye ventas anuladas', () => {
    const balances = customerBalances(
      [
        sale('s1', 'ana', 10000, 1),
        sale('s2', 'ana', 5000, 3),
        sale('s3', 'ana', 99999),
        { ...sale('void-s3', 'ana', 99999), type: 'void', voidedSaleId: 's3' },
        sale('s4', 'luis', 2000),
      ],
      [
        { customerId: 'ana', amountMinor: money(4000) },
        { customerId: 'luis', amountMinor: money(3000) },
      ],
    );
    expect(balances.get('ana')).toMatchObject({ owed: 15000, paid: 4000, balance: 11000 });
    expect(balances.get('ana')?.lastCreditAt).toEqual(new Date(Date.UTC(2026, 10, 3)));
    // Un abono mayor no deja saldo negativo.
    expect(balanceOf(balances, 'luis')).toBe(0);
    expect(balanceOf(balances, null)).toBe(0);
    expect(balanceOf(balances, 'nadie')).toBe(0);
  });
});
