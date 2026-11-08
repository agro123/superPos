import { Lock, Sparkles } from 'lucide-react';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, EmptyState, Skeleton, Text } from '@/shared/ui';
import type { useAiAdvisor } from '../application/useAiAdvisor';

const TONES = { alta: 'danger', media: 'warning', baja: 'info' } as const;

export interface AiAdvisorPanelProps {
  advisor: ReturnType<typeof useAiAdvisor>;
  /** Los datos del periodo aún cargan: no se puede analizar todavía. */
  loading: boolean;
}

/** Recomendaciones de la I.A. sobre los datos del periodo; se generan al pulsar el botón. */
export function AiAdvisorPanel({ advisor, loading }: AiAdvisorPanelProps) {
  const { status, analyze } = advisor;
  if (status === 'premium') {
    return (
      <EmptyState icon={<Lock />} title={t('ai.premiumTitle')} description={t('ai.premiumHint')} />
    );
  }
  if (status === 'unconfigured') {
    return (
      <EmptyState
        tone="danger"
        icon={<Sparkles />}
        title={t('ai.unconfigured')}
        description={t('ai.unconfiguredHint')}
      />
    );
  }
  const blocked = status !== 'ready' || loading;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <Text variant="strong">{t('ai.title')}</Text>
          <Text variant="caption">
            {status === 'checking'
              ? t('ai.checking')
              : t('ai.model', { model: advisor.modelName ?? '' })}
          </Text>
        </div>
        <Button
          leftIcon={<Sparkles aria-hidden className="size-5" />}
          disabled={blocked}
          loading={analyze.isPending}
          onClick={() => {
            analyze.mutate();
          }}
        >
          {t('ai.analyze')}
        </Button>
      </div>
      {status === 'invalid' ? (
        <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger-soft-fg">
          {advisor.modelError?.message ?? t('ai.invalid')}
        </p>
      ) : null}
      {analyze.isError ? (
        <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger-soft-fg">
          {analyze.error.message}
        </p>
      ) : null}
      {analyze.isPending ? <Skeleton className="h-48" /> : null}
      {analyze.data ? (
        <section aria-labelledby="ai-result" className="flex flex-col gap-3">
          <h3 id="ai-result" className="text-base font-semibold text-text">
            {t('ai.result')}
          </h3>
          <p className="text-sm text-text">{analyze.data.summary}</p>
          <ol className="flex flex-col gap-3">
            {analyze.data.recommendations.map((rec) => (
              <li
                key={rec.title}
                className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={TONES[rec.priority]}>{t(`ai.priority.${rec.priority}`)}</Badge>
                  <Badge>{t(`ai.area.${rec.area}`)}</Badge>
                  <strong className="text-text">{rec.title}</strong>
                </span>
                <span className="text-sm text-text">{rec.action}</span>
                <span className="text-xs text-text-muted">{rec.reason}</span>
              </li>
            ))}
          </ol>
          {advisor.workerLabels.length > 0 ? (
            <Text variant="caption">
              {t('ai.workerLegend', {
                legend: advisor.workerLabels.map((w) => `${w.label} = ${w.name}`).join(' · '),
              })}
            </Text>
          ) : null}
          <Text variant="caption">{t('ai.disclaimer')}</Text>
        </section>
      ) : null}
    </div>
  );
}
