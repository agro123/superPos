import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useCurrentShift } from '@/features/cash';
import type { CurrencyCode, Money } from '@/shared/domain/money';
import type { PaymentMethod } from '@/shared/domain/payment';
import { formatMoney } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, FormField, Modal, MoneyInput, Select, Text } from '@/shared/ui';
import { customerWrites } from '../application/useCustomers';
import type { Customer } from '../domain/customer';

export interface CreditPaymentDialogProps {
  customer: Customer | null;
  balance: Money;
  businessId: string;
  currency: CurrencyCode;
  methods: readonly PaymentMethod[];
  onClose: () => void;
  onRecorded: () => void;
}

/** Abono a la cuenta fiada. Entra a la caja abierta de este dispositivo (como una venta). */
export function CreditPaymentDialog({
  customer,
  balance,
  businessId,
  currency,
  methods,
  onClose,
  onRecorded,
}: CreditPaymentDialogProps) {
  const user = useCurrentUser();
  const { shift } = useCurrentShift(businessId);
  const [amount, setAmount] = useState<Money | null>(balance);
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? 'cash');
  const open = shift?.status === 'open';
  const valid = amount !== null && amount > 0 && amount <= balance;

  return (
    <Modal
      open={customer !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('credit.payTitle', { name: customer?.name ?? '' })}
      description={t('credit.balance', { amount: formatMoney(balance, currency) })}
      footer={
        <Button
          disabled={!open || !valid}
          onClick={() => {
            if (!customer || !shift || amount === null || !valid) return;
            customerWrites.recordCreditPayment(
              businessId,
              { customerId: customer.id, amountMinor: amount, method, cashShiftId: shift.id },
              user.uid,
            );
            onRecorded();
          }}
        >
          {t('credit.pay')}
        </Button>
      }
    >
      {open ? (
        <div className="flex flex-col gap-4">
          <FormField
            label={t('credit.amount')}
            error={
              valid ? undefined : t('credit.amountInvalid', { max: formatMoney(balance, currency) })
            }
          >
            {(control) => (
              <MoneyInput
                {...control}
                currency={currency}
                value={amount}
                onValueChange={setAmount}
              />
            )}
          </FormField>
          <FormField label={t('ui.payment.method')}>
            {(control) => (
              <Select
                {...control}
                options={methods.map((m) => ({ value: m, label: t(`payment.${m}`) }))}
                value={method}
                onValueChange={(value) => {
                  const next = methods.find((m) => m === value);
                  if (next) setMethod(next);
                }}
              />
            )}
          </FormField>
        </div>
      ) : (
        <Text variant="muted">{t('credit.needsShift')}</Text>
      )}
    </Modal>
  );
}
