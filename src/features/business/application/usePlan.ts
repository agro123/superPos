import { PLAN_LIMITS } from '@/shared/domain/plan';
import { useActiveBusiness } from './businessContext';

/**
 * Plan del negocio activo y sus límites. Solo experiencia de usuario: los cupos, los roles y los
 * administradores los imponen las reglas; reportes, I.A. y exportaciones se calculan en el
 * navegador y solo se pueden ocultar (ADR 0015).
 */
export function usePlan() {
  const { business } = useActiveBusiness();
  return {
    plan: business.plan,
    isPremium: business.plan === 'premium',
    limits: PLAN_LIMITS[business.plan],
  };
}
