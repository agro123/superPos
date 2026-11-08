/** API pública de la feature business (negocio activo y su configuración). */
export { ActiveBusinessProvider } from './application/ActiveBusinessProvider';
export { useActiveBusinessId, useActiveBusinessStore } from './application/activeBusinessStore';
export {
  useActiveBusiness,
  useOptionalActiveBusiness,
  type ActiveBusiness,
} from './application/businessContext';
export { businessWrites } from './application/useBusinessData';
export { usePlan } from './application/usePlan';
export { PremiumNotice } from './ui/PremiumNotice';
export {
  BUSINESS_PLANS,
  BUSINESS_STATUSES,
  BUSINESS_TYPES,
  businessNameSchema,
  businessSchema,
  businessStatusMachine,
  businessUpdateSchema,
  timeZoneSchema,
  type Business,
  type BusinessPlan,
  type BusinessStatus,
  type BusinessType,
} from './domain/business';
export { DEFAULT_TAX_OPTIONS, TIME_ZONES } from './domain/options';
export {
  BUSINESS_PRESETS,
  presetFor,
  type BusinessPreset,
  type PresetCategory,
  type PresetProduct,
} from './domain/presets';
export {
  DEFAULT_PAYMENT_METHODS,
  defaultModulesFor,
  defaultTaxRates,
  MODULE_IDS,
  type ModuleId,
  type TaxRate,
} from './domain/settings';

export const businessPages = {
  onboarding: () => import('./pages/OnboardingPage'),
  selectBusiness: () => import('./pages/SelectBusinessPage'),
};
