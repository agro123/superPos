import { useMutation, useQuery } from '@tanstack/react-query';
import { useActiveBusiness } from '@/features/business';
import { stockLevelOf, useProducts } from '@/features/catalog';
import { useCustomerBalances } from '@/features/customers';
import { AppError } from '@/shared/domain/errors';
import { addMoney, money, toMajorUnits } from '@/shared/domain/money';
import {
  checkGeminiModel,
  generateGeminiJson,
  readGeminiConfig,
} from '@/shared/infrastructure/ai/gemini';
import {
  ADVICE_RESPONSE_SCHEMA,
  adviceSchema,
  buildAdvicePrompt,
  type AdviceContext,
} from '../domain/aiAdvice';
import type { useReportsData } from './useReportsData';

type ReportsData = ReturnType<typeof useReportsData>;

/**
 * Asesor con I.A. (premium). La verificación del plan es de UX: sin servidor no hay forma de
 * impedir la llamada desde un cliente modificado (ver ADR 0013).
 */
export function useAiAdvisor(data: ReportsData, days: number) {
  const { business, modules } = useActiveBusiness();
  const products = useProducts(business.id);
  const credit = useCustomerBalances(business.id, modules.customers);
  const config = readGeminiConfig();
  const premium = business.plan === 'premium';

  const model = useQuery({
    queryKey: ['geminiModel', config?.model],
    queryFn: () => {
      if (!config) throw new AppError('config', 'Falta configurar Gemini');
      return checkGeminiModel(config);
    },
    enabled: premium && config !== null,
    retry: false,
    staleTime: Infinity,
  });

  // Los trabajadores se envían con etiquetas, no con su nombre (datos personales).
  const workerLabels = data.performance.map((row, index) => ({
    uid: row.uid,
    label: `Trabajador ${String(index + 1)}`,
  }));

  const analyze = useMutation({
    mutationFn: async () => {
      if (!config || !model.isSuccess)
        throw new AppError('config', 'El modelo de I.A. no está disponible');
      const major = (amount: number) => toMajorUnits(money(Math.round(amount)), business.currency);
      const context: AdviceContext = {
        businessName: business.name,
        businessType: business.type,
        currency: business.currency,
        days,
        totals: {
          sales: major(data.summary.total),
          count: data.summary.count,
          averageTicket: major(data.summary.averageTicket),
        },
        byHour: data.hours
          .filter((h) => h.total > 0)
          .map((h) => ({ hour: h.hour, total: major(h.total) })),
        paymentMix: data.mix.map((m) => ({
          method: m.method,
          share: Math.round(m.share * 100) / 100,
        })),
        topProducts: data.top.map((p) => ({ name: p.name, units: p.quantity })),
        profit: {
          grossMargin: major(data.profit.grossMargin),
          expenses: major(data.profit.expenses),
          shrinkage: major(data.profit.shrinkage),
          result: major(data.profit.result),
          coverage: Math.round(data.profit.coverage * 100) / 100,
          losing: data.profit.losing
            .slice(0, 5)
            .map((l) => ({ name: l.name, margin: major(l.margin) })),
          best: data.profit.byProduct
            .slice(0, 5)
            .map((l) => ({ name: l.name, margin: major(l.margin) })),
        },
        stock: {
          lowOrOut: (products.data ?? [])
            .filter((p) => p.active && ['low', 'out'].includes(stockLevelOf(p)))
            .slice(0, 15)
            .map((p) => ({ name: p.name, stock: p.stock })),
        },
        workers: data.performance.map((row, index) => ({
          label: workerLabels[index]?.label ?? '',
          salesCount: row.salesCount,
          total: major(row.total),
          voided: row.voidedCount,
        })),
        pendingCredit: major(addMoney(...[...credit.balances.values()].map((b) => b.balance))),
      };
      const raw = await generateGeminiJson(
        config,
        buildAdvicePrompt(context),
        ADVICE_RESPONSE_SCHEMA,
      );
      const parsed = adviceSchema.safeParse(raw);
      if (!parsed.success)
        throw new AppError('validation', 'La respuesta de la I.A. no tiene el formato esperado.');
      return parsed.data;
    },
  });

  const status = !premium
    ? 'premium'
    : !config
      ? 'unconfigured'
      : model.isPending
        ? 'checking'
        : model.isError
          ? 'invalid'
          : 'ready';
  return {
    status,
    modelName: model.data?.displayName ?? config?.model ?? null,
    modelError: model.error,
    analyze,
    workerLabels: workerLabels.map((w) => ({ label: w.label, name: data.workerName(w.uid) })),
  } as const;
}
