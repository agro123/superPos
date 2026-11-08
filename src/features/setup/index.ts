/** API pública de la feature setup (configuración inicial guiada y tour). */
export { useSetup, useSetupRedirect, useTourProgress } from './application/useSetup';
export { setupProgress } from './domain/setup';
export { SetupBanner } from './ui/SetupBanner';

export const setupPages = {
  wizard: () => import('./pages/SetupWizardPage'),
};
