import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SetupWizardPage from './SetupWizardPage';

const setupState = { completedSteps: [], skippedSteps: [], dismissedAt: null, completedAt: null };
const navigate = vi.fn();

vi.mock('react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/features/auth', () => ({ useCurrentUser: () => ({ uid: 'u1' }) }));
vi.mock('@/features/business', () => ({
  useActiveBusiness: () => ({
    business: { id: 'b1', type: 'cafe', name: 'Café', ownerUid: 'u1', timezone: 'UTC' },
  }),
  usePlan: () => ({ plan: 'free' }),
  MODULE_IDS: ['restaurant', 'customers'],
  presetFor: () => ({ modules: { restaurant: true, customers: false }, rolePresets: [], tips: [] }),
}));
vi.mock('@/features/settings', () => ({
  BusinessPanel: () => <div>BusinessPanel</div>,
  ModulesPanel: () => <div>ModulesPanel</div>,
  PaymentsPanel: () => <div>PaymentsPanel</div>,
  TaxesPanel: () => <div>TaxesPanel</div>,
}));
vi.mock('@/features/storefront', () => ({ StorefrontPanel: () => <div>StorefrontPanel</div> }));
vi.mock('@/features/terminals', () => ({ TerminalsPanel: () => <div>TerminalsPanel</div> }));
vi.mock('@/features/users', () => ({
  EmployeesPanel: () => <div>EmployeesPanel</div>,
  RolesPanel: () => <div>RolesPanel</div>,
}));
vi.mock('../application/useSetup', () => ({
  useSetup: () => ({ state: setupState, loading: false }),
  saveSetup: () => undefined,
}));
vi.mock('../ui/CategoriesStep', () => ({ CategoriesStep: () => <div>CategoriesStep</div> }));
vi.mock('../ui/ProductsStep', () => ({ ProductsStep: () => <div>ProductsStep</div> }));
vi.mock('../ui/CashStep', () => ({ CashStep: () => <div>CashStep</div> }));

describe('SetupWizardPage', () => {
  it('habilita "Empezar a vender" aunque el snapshot remoto llegue tarde', async () => {
    Object.assign(window, { scrollTo: vi.fn() });
    render(<SetupWizardPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    for (let i = 0; i < 8; i += 1)
      await userEvent.click(screen.getByRole('button', { name: 'Omitir este paso' }));
    expect(screen.getByRole('button', { name: 'Empezar a vender' })).toBeEnabled();
  });
});
