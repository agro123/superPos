import { describe, expect, it } from 'vitest';
import { receiptText } from './receipt';

describe('receiptText', () => {
  it('arma el ticket en texto', () => {
    const text = receiptText({
      title: 'Tienda Rosa · C1-000001',
      lines: [{ label: '2 × Arroz', value: '$ 6.400' }],
      totals: [{ label: 'Total', value: '$ 6.400', emphasis: true }],
      footer: ['1 nov 2026, 10:00', 'Gracias por su compra'],
    });
    expect(text).toBe(
      'Tienda Rosa · C1-000001\n\n2 × Arroz  $ 6.400\n\nTotal: $ 6.400\n\n1 nov 2026, 10:00\nGracias por su compra',
    );
  });
});
