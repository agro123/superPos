import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { Button } from '@/shared/ui';
import {
  REQUIRED_STEPS,
  SETUP_STEPS,
  type SetupProgressFields,
  type SetupStep,
} from '../domain/setup';

export interface WizardShellProps {
  step: SetupStep;
  state: SetupProgressFields;
  onGo: (step: SetupStep) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  onLater: () => void;
  canFinish: boolean;
  children: ReactNode;
}

/** Marco del asistente: pasos, avance y navegación (Atrás · Omitir · Siguiente). */
export function WizardShell({
  step,
  state,
  onGo,
  onBack,
  onSkip,
  onNext,
  onLater,
  canFinish,
  children,
}: WizardShellProps) {
  const index = SETUP_STEPS.indexOf(step);
  const isLast = step === 'done';
  const required = REQUIRED_STEPS.includes(step);
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:flex-row md:p-6">
      <nav aria-label={t('setup.steps')} className="md:w-60 md:shrink-0">
        <p className="mb-2 text-sm text-text-muted md:hidden">
          {t('setup.stepOf', { current: String(index + 1), total: String(SETUP_STEPS.length) })}
        </p>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${String(Math.round(((index + 1) / SETUP_STEPS.length) * 100))}%` }}
          />
        </div>
        <ol className="hidden flex-col gap-1 md:flex">
          {SETUP_STEPS.map((s, i) => {
            const done = state.completedSteps.includes(s);
            return (
              <li key={s}>
                <button
                  type="button"
                  aria-current={s === step ? 'step' : undefined}
                  onClick={() => {
                    onGo(s);
                  }}
                  className={cn(
                    'flex min-h-touch w-full items-center gap-2 rounded-md px-3 text-left text-sm',
                    s === step
                      ? 'bg-primary-soft font-semibold text-primary-soft-fg'
                      : 'text-text-muted hover:bg-surface-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs',
                      done ? 'text-success-fg bg-success' : 'bg-surface-muted',
                    )}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  {t(`setup.step.${s}`)}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <main id="main-content" className="flex min-w-0 flex-1 flex-col gap-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-text">{t(`setup.step.${step}`)}</h1>
            <p className="text-sm text-text-muted">{t(`setup.stepHint.${step}`)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onLater}>
            {t('setup.later')}
          </Button>
        </header>
        <section aria-label={t(`setup.step.${step}`)}>{children}</section>
        <footer className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onBack} disabled={index === 0}>
            {t('setup.back')}
          </Button>
          <div className="flex gap-2">
            {isLast || required ? null : (
              <Button variant="ghost" onClick={onSkip}>
                {t('setup.skip')}
              </Button>
            )}
            <Button onClick={onNext} disabled={isLast && !canFinish}>
              {isLast ? t('setup.start') : t('setup.next')}
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
