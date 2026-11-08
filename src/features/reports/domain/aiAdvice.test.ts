import { describe, expect, it } from 'vitest';
import { adviceSchema, buildAdvicePrompt, type AdviceContext } from './aiAdvice';

const context: AdviceContext = {
  businessName: 'Tienda Rosa',
  businessType: 'store',
  currency: 'COP',
  days: 14,
  totals: { sales: 1_500_000, count: 120, averageTicket: 12_500 },
  byHour: [{ hour: 8, total: 300_000 }],
  paymentMix: [{ method: 'cash', share: 0.7 }],
  topProducts: [{ name: 'Arroz', units: 40 }],
  profit: {
    grossMargin: 400_000,
    expenses: 50_000,
    shrinkage: 10_000,
    result: 340_000,
    coverage: 0.8,
    losing: [],
    best: [],
  },
  stock: { lowOrOut: [{ name: 'Detergente', stock: 0 }] },
  workers: [{ label: 'Trabajador 1', salesCount: 80, total: 1_000_000, voided: 1 }],
  pendingCredit: 25_000,
};

describe('asesor con I.A.', () => {
  it('arma el prompt con instrucciones y los datos en JSON', () => {
    const prompt = buildAdvicePrompt(context);
    expect(prompt).toContain('últimos 14 días');
    expect(prompt).toContain('"Detergente"');
    expect(prompt).toContain('No inventes datos');
  });

  it('valida la respuesta del modelo', () => {
    const ok = {
      summary: 'Buenas ventas en la mañana.',
      recommendations: [
        {
          title: 'Reponer detergente',
          action: 'Pide 20 unidades',
          reason: 'Está agotado',
          priority: 'alta',
          area: 'inventario',
        },
      ],
    };
    expect(adviceSchema.safeParse(ok).success).toBe(true);
    expect(adviceSchema.safeParse({ ...ok, recommendations: [] }).success).toBe(false);
    expect(
      adviceSchema.safeParse({
        ...ok,
        recommendations: [{ ...ok.recommendations[0], priority: 'urgente' }],
      }).success,
    ).toBe(false);
  });
});
