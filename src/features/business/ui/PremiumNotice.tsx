import { Crown } from 'lucide-react';
import { Link } from 'react-router';
import { t } from '@/shared/lib/i18n';
import { PremiumBadge } from '@/shared/ui';

export interface PremiumNoticeProps {
  /** Qué función es premium (título del aviso). */
  title: string;
  description: string;
  /** Versión compacta (una línea) para dentro de formularios. */
  compact?: boolean;
}

/** Aviso de función premium con enlace a la información del plan. */
export function PremiumNotice({ title, description, compact = false }: PremiumNoticeProps) {
  const link = (
    <Link to="/settings/plan" className="font-medium text-primary hover:underline">
      {t('plan.seePlans')}
    </Link>
  );
  if (compact) {
    return (
      <p
        role="note"
        className="flex flex-wrap items-center gap-2 rounded-md bg-warning-soft p-3 text-sm text-warning-soft-fg"
      >
        <PremiumBadge label={t('plan.premium')} />
        <span>{description}</span>
        {link}
      </p>
    );
  }
  return (
    <section
      aria-labelledby="premium-notice"
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-8 text-center"
    >
      <Crown aria-hidden className="size-10 text-warning" />
      <PremiumBadge label={t('plan.premium')} />
      <h2 id="premium-notice" className="text-lg font-semibold text-text">
        {title}
      </h2>
      <p className="max-w-md text-sm text-text-muted">{description}</p>
      {link}
    </section>
  );
}
