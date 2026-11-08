import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { MODULE_IDS, presetFor, useActiveBusiness, usePlan } from '@/features/business';
import { BusinessPanel, ModulesPanel, PaymentsPanel, TaxesPanel } from '@/features/settings';
import { StorefrontPanel } from '@/features/storefront';
import { TerminalsPanel } from '@/features/terminals';
import { EmployeesPanel, RolesPanel } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { Skeleton, Text } from '@/shared/ui';
import { saveSetup, useSetup } from '../application/useSetup';
import {
  canFinish,
  firstPendingStep,
  markStep,
  SETUP_STEPS,
  type SetupProgressFields,
  type SetupStep,
} from '../domain/setup';
import { CashStep } from '../ui/CashStep';
import { CategoriesStep } from '../ui/CategoriesStep';
import { DoneStep } from '../ui/DoneStep';
import { ProductsStep } from '../ui/ProductsStep';
import { WizardShell } from '../ui/WizardShell';

/** `true` si el estado guardado ya incluye todos los pasos marcados localmente. */
const reflects = (persisted: SetupProgressFields, local: SetupProgressFields) =>
  local.completedSteps.every((s) => persisted.completedSteps.includes(s)) &&
  local.skippedSteps.every((s) => persisted.skippedSteps.includes(s));

const EMPTY: SetupProgressFields = {
  completedSteps: [],
  skippedSteps: [],
  dismissedAt: null,
  completedAt: null,
};

/** Configuración inicial guiada del negocio (se adapta al tipo con `presetFor`). */
export default function SetupWizardPage() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const { plan } = usePlan();
  const navigate = useNavigate();
  const { state: stored, loading } = useSetup();
  const persisted = stored ?? EMPTY;
  // Progreso local para no perder pasos si el snapshot llega tarde (sin red). Va ligado al
  // negocio y cede al remoto en cuanto este lo refleja, para no ignorar cambios de otro dispositivo.
  const [optimistic, setOptimistic] = useState<{
    businessId: string;
    fields: SetupProgressFields;
  } | null>(null);
  const pending =
    optimistic?.businessId === business.id && !reflects(persisted, optimistic.fields)
      ? optimistic.fields
      : null;
  const state = pending ?? persisted;
  const [current, setCurrent] = useState<SetupStep | null>(null);
  const [leaving, setLeaving] = useState(false);
  // Se sale cuando el estado guardado ya lo refleja; si no, la redirección del layout aún ve
  // "pendiente" y devuelve al asistente.
  const settled = leaving && (persisted.completedAt !== null || persisted.dismissedAt !== null);
  useEffect(() => {
    if (settled) void navigate('/', { replace: true });
  }, [settled, navigate]);
  if (loading) return <Skeleton className="m-6 h-96" />;
  const step = current ?? firstPendingStep(state);
  const preset = presetFor(business.type);
  const index = SETUP_STEPS.indexOf(step);
  const go = (next: SetupStep) => {
    setCurrent(next);
    window.scrollTo({ top: 0 });
  };
  const advance = (kind: 'completed' | 'skipped') => {
    const next = markStep(state, step, kind);
    setOptimistic({ businessId: business.id, fields: next });
    if (step === 'done') {
      saveSetup(business.id, { ...next, complete: true });
      setLeaving(true);
      return;
    }
    saveSetup(business.id, next);
    go(SETUP_STEPS[index + 1] ?? 'done');
  };

  const content: Record<SetupStep, ReactNode> = {
    business: <BusinessPanel />,
    modules: (
      <div className="flex flex-col gap-3">
        <Text variant="muted">
          {t('setup.modules.recommended', {
            list: MODULE_IDS.filter((id) => preset.modules[id])
              .map((id) => t(`settings.module.${id}`))
              .join(', '),
          })}
        </Text>
        <ModulesPanel />
      </div>
    ),
    categories: <CategoriesStep />,
    products: <ProductsStep />,
    taxes: (
      <div className="flex flex-col gap-6">
        <TaxesPanel />
        <PaymentsPanel />
      </div>
    ),
    cash: <CashStep />,
    team: (
      <div className="flex flex-col gap-6">
        <Text variant="muted">
          {t('setup.team.suggested', {
            roles: preset.rolePresets.map((r) => t(`roles.preset.${r}`)).join(', '),
          })}
        </Text>
        <RolesPanel businessId={business.id} currentUid={user.uid} plan={plan} />
        <EmployeesPanel
          businessId={business.id}
          businessName={business.name}
          ownerUid={business.ownerUid}
          currentUid={user.uid}
          plan={plan}
        />
      </div>
    ),
    devices: (
      <TerminalsPanel
        businessId={business.id}
        businessName={business.name}
        timezone={business.timezone}
      />
    ),
    storefront: <StorefrontPanel />,
    done: <DoneStep state={state} />,
  };

  return (
    <WizardShell
      step={step}
      state={state}
      canFinish={canFinish(markStep(state, step, 'completed'))}
      onGo={go}
      onBack={() => {
        go(SETUP_STEPS[Math.max(0, index - 1)] ?? 'business');
      }}
      onSkip={() => {
        advance('skipped');
      }}
      onNext={() => {
        advance('completed');
      }}
      onLater={() => {
        saveSetup(business.id, { ...state, dismiss: true });
        setLeaving(true);
      }}
    >
      {content[step]}
    </WizardShell>
  );
}
