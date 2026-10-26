import { ArrowLeftRight, Banknote, CircleEllipsis, CreditCard, Smartphone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ZERO_MONEY, type CurrencyCode, type Money } from '@/shared/domain/money';
import { summarizeTenders, worksOffline, type PaymentMethod } from '@/shared/domain/payment';
import {
  currencyUsesDecimals,
  formatMoney,
  moneyToInputText,
  parseMoneyInput,
} from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, Numpad, PaymentSheet } from '@/shared/ui';

const ICONS: Record<PaymentMethod, ReactNode> = {
  cash: <Banknote />,
  card: <CreditCard />,
  transfer: <ArrowLeftRight />,
  wallet: <Smartphone />,
  other: <CircleEllipsis />,
};

export interface PaymentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: Money;
  currency: CurrencyCode;
  methods: readonly PaymentMethod[];
  online: boolean;
  onConfirm: (method: PaymentMethod, tendered: Money) => void;
}

/**
 * Cobro (solo UI en esta fase): método, monto recibido y vuelto con `summarizeTenders`.
 * Sin conexión solo se ofrecen los métodos que funcionan offline.
 */
export function PaymentPanel({
  open,
  onOpenChange,
  total,
  currency,
  methods,
  online,
  onConfirm,
}: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? 'cash');
  const [tenderedText, setTenderedText] = useState('');
  const isCash = method === 'cash';
  const tendered = isCash ? (parseMoneyInput(tenderedText, currency) ?? ZERO_MONEY) : total;
  const summary = summarizeTenders(total, tendered > 0 ? [{ method, amount: tendered }] : []);
  const remaining = summary.ok ? summary.value.remaining : total;
  const change = summary.ok ? summary.value.change : ZERO_MONEY;
  const blockedOffline = !online && !worksOffline(method);

  return (
    <PaymentSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setTenderedText('');
        onOpenChange(next);
      }}
      totalLabel={formatMoney(total, currency)}
      methods={methods.map((value) => ({
        value,
        label: t(`payment.${value}`),
        icon: ICONS[value],
        disabled: !online && !worksOffline(value),
      }))}
      method={method}
      onMethodChange={setMethod}
      tenderedLabel={formatMoney(tendered, currency)}
      summary={
        remaining > 0
          ? {
              label: t('ui.payment.remaining'),
              value: formatMoney(remaining, currency),
              tone: 'warning',
            }
          : { label: t('ui.payment.change'), value: formatMoney(change, currency), tone: 'success' }
      }
      notice={
        online ? null : (
          <p className="rounded-md bg-warning-soft p-3 text-sm text-warning-soft-fg">
            {t('pos.offlineCash')}
          </p>
        )
      }
      keypad={
        isCash ? (
          <div className="flex flex-col gap-2">
            <Numpad
              value={tenderedText}
              onValueChange={setTenderedText}
              allowDecimal={currencyUsesDecimals(currency)}
            />
            <Button
              variant="secondary"
              onClick={() => {
                setTenderedText(moneyToInputText(total, currency));
              }}
            >
              {t('pos.exact')}
            </Button>
          </div>
        ) : null
      }
      confirmLabel={t('pos.confirm')}
      confirmDisabled={!summary.ok || remaining > 0 || blockedOffline}
      onConfirm={() => {
        onConfirm(method, tendered);
      }}
    />
  );
}
