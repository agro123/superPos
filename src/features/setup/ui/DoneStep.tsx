import { CheckCircle2, CircleDashed, SkipForward } from 'lucide-react';
import { presetFor, useActiveBusiness } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { Text } from '@/shared/ui';
import { SETUP_STEPS, type SetupProgressFields } from '../domain/setup';

export interface DoneStepProps {
  state: SetupProgressFields;
}

/** Resumen final: qué quedó listo, qué se omitió y consejos para el tipo de negocio. */
export function DoneStep({ state }: DoneStepProps) {
  const { business } = useActiveBusiness();
  const tips = presetFor(business.type).tips;
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label={t('setup.done.summary')} className="flex flex-col gap-2">
        {SETUP_STEPS.filter((s) => s !== 'done').map((step) => {
          const done = state.completedSteps.includes(step);
          const skipped = state.skippedSteps.includes(step);
          const Icon = done ? CheckCircle2 : skipped ? SkipForward : CircleDashed;
          return (
            <li key={step} className="flex items-center gap-2 text-sm">
              <Icon
                aria-hidden
                className={done ? 'size-5 text-success' : 'size-5 text-text-subtle'}
              />
              <span className="text-text">{t(`setup.step.${step}`)}</span>
              <span className="text-text-muted">
                ·{' '}
                {t(
                  done ? 'setup.done.ready' : skipped ? 'setup.done.skipped' : 'setup.done.pending',
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {tips.length > 0 ? (
        <section
          aria-labelledby="tips"
          className="flex flex-col gap-1 rounded-lg bg-surface-muted p-4"
        >
          <h3 id="tips" className="text-sm font-semibold text-text">
            {t('setup.done.tips')}
          </h3>
          {tips.map((tip) => (
            <Text key={tip} variant="muted">
              • {t(`setup.tip.${tip}`)}
            </Text>
          ))}
        </section>
      ) : null}
      <Text variant="caption">{t('setup.done.later')}</Text>
    </div>
  );
}
