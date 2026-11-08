import { z } from 'zod';

export const ADVICE_AREAS = [
  'ventas',
  'inventario',
  'ganancia',
  'caja',
  'personal',
  'clientes',
] as const;
export const ADVICE_PRIORITIES = ['alta', 'media', 'baja'] as const;

/** Respuesta del asesor: se valida con Zod (no se confía en el modelo). */
export const adviceSchema = z.object({
  summary: z.string().min(1).max(1500),
  recommendations: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        action: z.string().min(1).max(600),
        reason: z.string().min(1).max(600),
        priority: z.enum(ADVICE_PRIORITIES),
        area: z.enum(ADVICE_AREAS),
      }),
    )
    .min(1)
    .max(8),
});
export type Advice = z.infer<typeof adviceSchema>;

/** Mismo contrato en el formato `responseSchema` de Gemini (OpenAPI). */
export const ADVICE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    recommendations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          action: { type: 'STRING' },
          reason: { type: 'STRING' },
          priority: { type: 'STRING', enum: [...ADVICE_PRIORITIES] },
          area: { type: 'STRING', enum: [...ADVICE_AREAS] },
        },
        required: ['title', 'action', 'reason', 'priority', 'area'],
      },
    },
  },
  required: ['summary', 'recommendations'],
} as const;

/**
 * Datos agregados que se envían al modelo: solo totales y nombres de productos; nunca datos de
 * clientes (nombres, teléfonos, documentos) ni de trabajadores identificables.
 */
export interface AdviceContext {
  businessName: string;
  businessType: string;
  currency: string;
  days: number;
  totals: { sales: number; count: number; averageTicket: number };
  byHour: readonly { hour: number; total: number }[];
  paymentMix: readonly { method: string; share: number }[];
  topProducts: readonly { name: string; units: number }[];
  profit: {
    grossMargin: number;
    expenses: number;
    shrinkage: number;
    result: number;
    coverage: number;
    losing: readonly { name: string; margin: number }[];
    best: readonly { name: string; margin: number }[];
  };
  stock: { lowOrOut: readonly { name: string; stock: number }[] };
  workers: readonly { label: string; salesCount: number; total: number; voided: number }[];
  pendingCredit: number;
}

/** Instrucciones + datos (JSON). Montos en unidades mayores de la moneda indicada. */
export function buildAdvicePrompt(context: AdviceContext): string {
  return [
    'Eres un asesor de negocios para pequeños comercios en Colombia (tiendas, cafeterías, restaurantes).',
    `Analiza los datos de "${context.businessName}" (${context.businessType}) de los últimos ${String(context.days)} días.`,
    'Responde en español, con un resumen breve y de 3 a 6 recomendaciones concretas y accionables para esta semana.',
    'Cada recomendación debe decir qué hacer, por qué (citando los números) y su prioridad.',
    'No inventes datos que no estén abajo. Si falta información (p. ej. costos de productos), recomiéndale registrarla.',
    `Los montos están en ${context.currency} (unidades enteras). Los porcentajes van de 0 a 1.`,
    '',
    'DATOS:',
    JSON.stringify(context),
  ].join('\n');
}
