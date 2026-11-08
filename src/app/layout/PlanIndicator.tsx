import { Link } from 'react-router';
import { usePlan } from '@/features/business';
import { usePermission } from '@/features/users';
import { t } from '@/shared/lib/i18n';
import { Badge, PremiumBadge } from '@/shared/ui';

/** Plan del negocio en la barra superior; quien administra lo abre para ver o cambiar el plan. */
export function PlanIndicator() {
  const { plan } = usePlan();
  const canManage = usePermission('settings.manage');
  const badge =
    plan === 'premium' ? (
      <PremiumBadge label={t('plan.premium')} />
    ) : (
      <Badge>{t('plan.name.free')}</Badge>
    );
  if (!canManage) return <span className="hidden sm:inline-flex">{badge}</span>;
  return (
    <Link
      to="/settings/plan"
      aria-label={t('plan.indicator', { plan: t(`plan.name.${plan}`) })}
      className="hidden min-h-touch items-center rounded-md px-1 sm:inline-flex"
    >
      {badge}
    </Link>
  );
}
