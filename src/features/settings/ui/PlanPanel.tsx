import { Check, Crown, Download, Mail, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness, usePlan } from '@/features/business';
import { useEmailPreference } from '@/features/storefront';
import { PLAN_CONTACT, PLAN_LIMITS, type BusinessPlan } from '@/shared/domain/plan';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { emailComposeUrl } from '@/shared/lib/share';
import { Badge, Button, PremiumBadge, Text } from '@/shared/ui';
import { useBackup } from '../application/useBackup';

const FEATURES = [
  'workerSeats',
  'customRoles',
  'extraAdmins',
  'reports',
  'ai',
  'exports',
  'historyDays',
] as const;

function Value({ plan, feature }: { plan: BusinessPlan; feature: (typeof FEATURES)[number] }) {
  const value = PLAN_LIMITS[plan][feature];
  if (typeof value === 'number') {
    return (
      <span>
        {feature === 'historyDays' ? t('plan.days', { days: String(value) }) : String(value)}
      </span>
    );
  }
  return value ? (
    <Check aria-label={t('plan.included')} className="mx-auto size-5 text-success" />
  ) : (
    <X aria-label={t('plan.notIncluded')} className="mx-auto size-5 text-text-subtle" />
  );
}

/** Plan del negocio, comparación, solicitud de cambio y respaldo completo (premium). */
export function PlanPanel() {
  const { business } = useActiveBusiness();
  const { plan, limits } = usePlan();
  const email = useEmailPreference(business.id);
  const backup = useBackup();
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const wanted: BusinessPlan = plan === 'premium' ? 'free' : 'premium';
  const body = t('plan.requestBody', {
    business: business.name,
    id: business.id,
    current: t(`plan.name.${plan}`),
    wanted: t(`plan.name.${wanted}`),
  });

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="current-plan"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted p-4"
      >
        <div className="flex items-center gap-3">
          {plan === 'premium' ? <Crown aria-hidden className="size-8 text-warning" /> : null}
          <div>
            <h3 id="current-plan" className="text-lg font-semibold text-text">
              {t('plan.current', { plan: t(`plan.name.${plan}`) })}
            </h3>
            <Text variant="muted">{t(`plan.summary.${plan}`)}</Text>
          </div>
        </div>
        {plan === 'premium' ? (
          <PremiumBadge label={t('plan.premium')} />
        ) : (
          <Badge>{t('plan.name.free')}</Badge>
        )}
      </section>

      <table className="w-full text-left text-sm">
        <caption className="sr-only">{t('plan.compare')}</caption>
        <thead className="text-xs text-text-muted uppercase">
          <tr>
            <th scope="col" className="py-2">
              {t('plan.feature')}
            </th>
            <th scope="col" className="py-2 text-center">
              {t('plan.name.free')}
            </th>
            <th scope="col" className="py-2 text-center">
              {t('plan.name.premium')}
            </th>
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((feature) => (
            <tr key={feature} className="border-t border-border">
              <th scope="row" className="py-2 font-normal text-text">
                {t(`plan.feature.${feature}`)}
              </th>
              <td className="py-2 text-center">
                <Value plan="free" feature={feature} />
              </td>
              <td className="py-2 text-center">
                <Value plan="premium" feature={feature} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Text variant="caption">{t('plan.bothInclude')}</Text>

      <section
        aria-labelledby="request-plan"
        className="flex flex-col gap-3 rounded-lg border border-border p-4"
      >
        <h3 id="request-plan" className="text-base font-semibold text-text">
          {t(plan === 'premium' ? 'plan.requestDowngrade' : 'plan.requestUpgrade')}
        </h3>
        <Text variant="muted">{t('plan.requestHint')}</Text>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={PLAN_CONTACT.phoneHref}>
              <Phone aria-hidden className="size-5" />
              {t('plan.call', { phone: PLAN_CONTACT.phone })}
            </a>
          </Button>
          <Button asChild>
            <a
              href={emailComposeUrl(
                email.provider,
                {
                  to: PLAN_CONTACT.email,
                  subject: t('plan.requestSubject', { business: business.name }),
                  body,
                },
                email.customUrl,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail aria-hidden className="size-5" />
              {t('plan.write', { email: PLAN_CONTACT.email })}
            </a>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="backup"
        className="flex flex-col gap-2 rounded-lg border border-border p-4"
      >
        <h3 id="backup" className="flex items-center gap-2 text-base font-semibold text-text">
          {t('plan.backupTitle')}
          <PremiumBadge label={t('plan.premium')} />
        </h3>
        <Text variant="muted">{t('plan.backupHint')}</Text>
        <Button
          className="self-start"
          variant="outline"
          leftIcon={<Download aria-hidden className="size-5" />}
          disabled={!limits.exports || backup.loading}
          loading={downloading}
          onClick={() => {
            setDownloading(true);
            try {
              backup.download();
              toast({ title: t('plan.backupDone'), tone: 'success' });
            } finally {
              setDownloading(false);
            }
          }}
        >
          {t('plan.backupDownload')}
        </Button>
        {limits.exports ? null : <Text variant="caption">{t('plan.backupPremium')}</Text>}
      </section>
    </div>
  );
}
