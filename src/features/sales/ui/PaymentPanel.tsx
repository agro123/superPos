import {
  ArrowLeftRight,
  Banknote,
  CircleEllipsis,
  CreditCard,
  NotebookPen,
  Smartphone,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  addMoney,
  subtractMoney,
  ZERO_MONEY,
  type CurrencyCode,
  type Money,
} from '@/shared/domain/money';
import {
  summarizeTenders,
  worksOffline,
  type PaymentMethod,
  type Tender,
  type TenderMethod,
} from '@/shared/domain/payment';
import {
  currencyUsesDecimals,
  formatMoney,
  moneyToInputText,
  parseMoneyInput,
} from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Button, IconButton, Numpad, PaymentSheet } from '@/shared/ui';

const ICONS: Record<TenderMethod, ReactNode> = {
  cash: <Banknote />,
  card: <CreditCard />,
  transfer: <ArrowLeftRight />,
  wallet: <Smartphone />,
  other: <CircleEllipsis />,
  credit: <NotebookPen />,
};

export interface PaymentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: Money;
  currency: CurrencyCode;
  methods: readonly PaymentMethod[];
  online: boolean;
  /** Fiado disponible: hay un cliente registrado en la orden. */
  allowCredit: boolean;
  onConfirm: (tenders: Tender[]) => void;
}

/**
 * Cobro con pago mixto: se agregan pagos (método + monto) hasta cubrir el total; el último puede
 * confirmarse directamente. Solo el efectivo puede exceder el total (vuelto, `summarizeTenders`).
 */
export function PaymentPanel({
  open,
  onOpenChange,
  total,
  currency,
  methods,
  online,
  allowCredit,
  onConfirm,
}: PaymentPanelProps) {
  const options: TenderMethod[] = [...methods, ...(allowCredit ? (['credit'] as const) : [])];
  const [method, setMethod] = useState<TenderMethod>(methods[0] ?? 'cash');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [text, setText] = useState('');
  const paidBefore = addMoney(...tenders.map((tender) => tender.amount));
  const due = paidBefore >= total ? ZERO_MONEY : subtractMoney(total, paidBefore);
  const amount = parseMoneyInput(text, currency) ?? ZERO_MONEY;
  const current: Tender[] = amount > 0 ? [{ method, amount }] : [];
  const all = [...tenders, ...current];
  const summary = summarizeTenders(total, all);
  const remaining = summary.ok ? summary.value.remaining : due;
  const change = summary.ok ? summary.value.change : ZERO_MONEY;
  const blockedOffline = !online && all.some((tender) => !worksOffline(tender.method));
  const creditBlocked = method === 'credit' && !allowCredit;

  const reset = () => {
    setTenders([]);
    setText('');
  };
  const choose = (next: TenderMethod) => {
    setMethod(next);
    // Los pagos no en efectivo proponen el saldo pendiente.
    setText(next === 'cash' ? '' : moneyToInputText(due, currency));
  };
  const addTender = () => {
    if (!summary.ok || current.length === 0 || remaining === ZERO_MONEY) return;
    setTenders(all);
    setText('');
  };

  return (
    <PaymentSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      totalLabel={formatMoney(total, currency)}
      methods={options.map((value) => ({
        value,
        label: t(`payment.${value}`),
        icon: ICONS[value],
        disabled: !online && !worksOffline(value),
      }))}
      method={method}
      onMethodChange={choose}
      tenderedLabel={formatMoney(amount, currency)}
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
        <>
          {online ? null : (
            <p className="rounded-md bg-warning-soft p-3 text-sm text-warning-soft-fg">
              {t('pos.offlineCash')}
            </p>
          )}
          {allowCredit ? null : (
            <p className="text-xs text-text-muted">{t('pos.creditNeedsCustomer')}</p>
          )}
        </>
      }
      tenders={
        tenders.length > 0 ? (
          <ul aria-label={t('pos.tenders')} className="flex flex-col gap-1">
            {tenders.map((tender, index) => (
              <li
                key={`${tender.method}-${String(index)}`}
                className="flex items-center justify-between rounded-md border border-border px-3"
              >
                <span className="text-sm">{t(`payment.${tender.method}`)}</span>
                <span className="flex items-center gap-1 font-medium tabular-nums">
                  {formatMoney(tender.amount, currency)}
                  <IconButton
                    label={t('pos.removeTender', { method: t(`payment.${tender.method}`) })}
                    icon={<X />}
                    onClick={() => {
                      setTenders(tenders.filter((_, i) => i !== index));
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : null
      }
      keypad={
        <div className="flex flex-col gap-2">
          <Numpad
            value={text}
            onValueChange={setText}
            allowDecimal={currencyUsesDecimals(currency)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setText(moneyToInputText(due, currency));
              }}
            >
              {t('pos.exact')}
            </Button>
            <Button
              variant="outline"
              disabled={!summary.ok || current.length === 0 || remaining === ZERO_MONEY}
              onClick={addTender}
            >
              {t('pos.addTender')}
            </Button>
          </div>
        </div>
      }
      confirmLabel={t('pos.confirm')}
      confirmDisabled={!summary.ok || remaining > 0 || blockedOffline || creditBlocked}
      onConfirm={() => {
        onConfirm(all);
        reset();
      }}
    />
  );
}
