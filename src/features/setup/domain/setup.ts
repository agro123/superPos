import { z } from 'zod';
import { auditFieldsSchema } from '@/shared/domain/audit';

/** Pasos del asistente, en orden. Solo `business` es obligatorio; `done` es el cierre. */
export const SETUP_STEPS = [
  'business',
  'modules',
  'categories',
  'products',
  'taxes',
  'cash',
  'team',
  'devices',
  'storefront',
  'done',
] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

export const REQUIRED_STEPS: readonly SetupStep[] = ['business'];

/** `businesses/{bid}/settings/setup`: avance de la configuración inicial. */
export const setupStateSchema = z
  .object({
    id: z.string(),
    completedSteps: z.array(z.enum(SETUP_STEPS)),
    skippedSteps: z.array(z.enum(SETUP_STEPS)),
    /** "Configurar después": no se vuelve a redirigir al asistente. */
    dismissedAt: z.date().nullable(),
    completedAt: z.date().nullable(),
  })
  .extend(auditFieldsSchema.shape);
export type SetupState = z.infer<typeof setupStateSchema>;

export type SetupProgressFields = Pick<
  SetupState,
  'completedSteps' | 'skippedSteps' | 'dismissedAt' | 'completedAt'
>;

/** Avance sobre los pasos configurables (sin el cierre). */
export function setupProgress(state: Pick<SetupState, 'completedSteps' | 'skippedSteps'>) {
  const steps = SETUP_STEPS.filter((step) => step !== 'done');
  const handled = steps.filter(
    (s) => state.completedSteps.includes(s) || state.skippedSteps.includes(s),
  );
  return {
    done: handled.length,
    total: steps.length,
    percent: Math.round((handled.length / steps.length) * 100),
  };
}

/** Marca un paso como hecho u omitido (sin duplicados; hacerlo después de omitirlo lo corrige). */
export function markStep(
  state: SetupProgressFields,
  step: SetupStep,
  kind: 'completed' | 'skipped',
): SetupProgressFields {
  const completed = state.completedSteps.filter((s) => s !== step);
  const skipped = state.skippedSteps.filter((s) => s !== step);
  return kind === 'completed'
    ? { ...state, completedSteps: [...completed, step], skippedSteps: skipped }
    : { ...state, completedSteps: completed, skippedSteps: [...skipped, step] };
}

/** Primer paso pendiente (para retomar donde quedó). */
export function firstPendingStep(
  state: Pick<SetupState, 'completedSteps' | 'skippedSteps'>,
): SetupStep {
  return (
    SETUP_STEPS.find((s) => !state.completedSteps.includes(s) && !state.skippedSteps.includes(s)) ??
    'done'
  );
}

export const canFinish = (state: Pick<SetupState, 'completedSteps'>) =>
  REQUIRED_STEPS.every((step) => state.completedSteps.includes(step));

/**
 * Se redirige al asistente si el negocio lo tiene pendiente, nadie lo pospuso y el usuario puede
 * configurarlo. Los negocios anteriores a esta función no tienen documento: no se redirigen.
 */
export function needsSetup(state: SetupProgressFields | null, canManage: boolean): boolean {
  return canManage && state !== null && state.completedAt === null && state.dismissedAt === null;
}

/**
 * El tour se muestra una sola vez por persona, cuando el negocio ya está configurado (o es
 * anterior al asistente) y esa persona aún no lo ha visto ni omitido.
 */
export function shouldStartTour(state: SetupProgressFields | null, tourSeen: boolean): boolean {
  if (tourSeen) return false;
  return state?.completedAt !== null || state.dismissedAt !== null;
}

/** `businesses/{bid}/tourProgress/{uid}`. */
export const tourProgressSchema = z
  .object({ id: z.string(), status: z.enum(['done', 'skipped']) })
  .extend(auditFieldsSchema.shape);
export type TourProgress = z.infer<typeof tourProgressSchema>;
