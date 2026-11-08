import { Wallet } from 'lucide-react';
import { presetFor, useActiveBusiness } from '@/features/business';
import { fromMajorUnits } from '@/shared/domain/money';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Text } from '@/shared/ui';

/** Cómo funciona la caja y la base sugerida según el tipo de negocio. */
export function CashStep() {
  const { business } = useActiveBusiness();
  const float = fromMajorUnits(presetFor(business.type).suggestedFloat, business.currency);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4">
        <Wallet aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <Text variant="strong">
            {t('setup.cash.float', { amount: formatMoney(float, business.currency) })}
          </Text>
          <Text variant="muted">{t('setup.cash.hint')}</Text>
        </div>
      </div>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-text">
        <li>{t('setup.cash.point1')}</li>
        <li>{t('setup.cash.point2')}</li>
        <li>{t('setup.cash.point3')}</li>
      </ul>
    </div>
  );
}
