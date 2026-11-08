import { useState } from 'react';
import { businessWrites, useActiveBusiness } from '@/features/business';
import { PAYMENT_METHODS, type PaymentMethod } from '@/shared/domain/payment';
import { useToast } from '@/shared/hooks/useToast';
import { t } from '@/shared/lib/i18n';
import { Button, Checkbox, Text } from '@/shared/ui';

/** Formulario de payments (Configuración y asistente de configuración inicial). */
export function PaymentsPanel() {
  const { business, paymentMethods } = useActiveBusiness();
  const toast = useToast();
  const [enabled, setEnabled] = useState<readonly PaymentMethod[]>(paymentMethods);
  const toggle = (method: PaymentMethod, checked: boolean) => {
    setEnabled((current) =>
      checked
        ? PAYMENT_METHODS.filter((m) => m === method || current.includes(m))
        : current.filter((m) => m !== method),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col">
        {PAYMENT_METHODS.map((method) => (
          <li key={method} className="flex min-h-touch items-center gap-3">
            <Checkbox
              id={`method-${method}`}
              checked={enabled.includes(method)}
              onCheckedChange={(checked) => {
                toggle(method, checked);
              }}
            />
            <label htmlFor={`method-${method}`} className="text-sm text-text">
              {t(`payment.${method}`)}
            </label>
          </li>
        ))}
      </ul>
      {enabled.length === 0 ? <Text variant="danger">{t('settings.paymentsMin')}</Text> : null}
      <Button
        className="self-start"
        disabled={enabled.length === 0}
        onClick={() => {
          businessWrites.updatePaymentMethods(business.id, enabled);
          toast({ title: t('common.saved'), tone: 'success' });
        }}
      >
        {t('common.save')}
      </Button>
    </div>
  );
}
