import { Crown } from 'lucide-react';
import type { BusinessPlan } from '@/features/business';
import { t } from '@/shared/lib/i18n';
import { Badge } from '@/shared/ui';

/** Plan del negocio; premium lleva ícono para no depender solo del color. */
export function PlanBadge({ plan }: { plan: BusinessPlan }) {
  return plan === 'premium' ? (
    <Badge tone="primary" icon={<Crown aria-hidden />}>
      {t('plan.premium')}
    </Badge>
  ) : (
    <Badge>{t('plan.free')}</Badge>
  );
}
