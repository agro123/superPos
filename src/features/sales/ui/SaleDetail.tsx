import { Printer } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { multiplyMoney, type CurrencyCode, type Money } from '@/shared/domain/money';
import { errorMessage } from '@/shared/lib/errorMessage';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, Button, Divider, Drawer, Text } from '@/shared/ui';
import { printReceipt } from '../application/useSales';
import type { SaleRecord } from '../domain/ports';

export interface SaleDetailProps {
  sale: SaleRecord | null;
  voided: boolean;
  businessName: string;
  currency: CurrencyCode;
  timeZone: string;
  onClose: () => void;
}

export function SaleDetail({
  sale,
  voided,
  businessName,
  currency,
  timeZone,
  onClose,
}: SaleDetailProps) {
  const toast = useToast();
  const money = (amount: Money) => formatMoney(amount, currency);
  if (!sale) return null;

  const print = async () => {
    const result = await printReceipt({
      title: `${businessName} · ${sale.number}`,
      lines: [
        ...sale.lines
          .filter((line) => !line.voided)
          .map((line) => ({
            label: `${formatNumber(line.quantity)} × ${line.name}`,
            value: money(multiplyMoney(line.unitPriceMinor, line.quantity)),
          })),
        { label: t('pos.tax'), value: money(sale.taxMinor) },
        { label: t('pos.total'), value: money(sale.totalMinor) },
      ],
      footer: formatDateTime(sale.occurredAt, timeZone),
    });
    toast(
      result.ok
        ? { title: t('sales.printed'), tone: 'success' }
        : { title: errorMessage(result.error), tone: 'danger' },
    );
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('sales.detail', { number: sale.number })}
      description={formatDateTime(sale.occurredAt, timeZone)}
      footer={
        <Button
          variant="outline"
          leftIcon={<Printer aria-hidden className="size-5" />}
          onClick={() => void print()}
        >
          {t('sales.print')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          {voided ? <Badge tone="danger">{t('sales.voided')}</Badge> : null}
          {sale.pendingSync ? <Badge tone="warning">{t('common.pendingSync')}</Badge> : null}
        </div>
        <section aria-label={t('sales.lines')}>
          <ul className="flex flex-col gap-2">
            {sale.lines.map((line, index) => (
              <li key={`${line.productId}-${index}`} className="flex justify-between gap-2 text-sm">
                <span className={line.voided ? 'text-text-subtle line-through' : 'text-text'}>
                  {line.name}
                  <span className="block text-xs text-text-subtle">
                    {t('sales.unitPrice', {
                      quantity: formatNumber(line.quantity),
                      price: money(line.unitPriceMinor),
                    })}
                  </span>
                </span>
                <span className="tabular-nums">
                  {money(multiplyMoney(line.unitPriceMinor, line.quantity))}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <Divider />
        <dl className="flex flex-col gap-1 text-sm">
          {(
            [
              [t('pos.subtotal'), sale.subtotalMinor],
              [t('pos.tax'), sale.taxMinor],
              [t('pos.total'), sale.totalMinor],
            ] satisfies [string, Money][]
          ).map(([label, amount]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-text-muted">{label}</dt>
              <dd className="font-medium tabular-nums">{money(amount)}</dd>
            </div>
          ))}
        </dl>
        <Divider />
        <section aria-label={t('sales.payments')} className="flex flex-col gap-1 text-sm">
          {sale.payments.map((payment, index) => (
            <p key={index} className="flex justify-between">
              <span>{t(`payment.${payment.method}`)}</span>
              <span className="tabular-nums">{money(payment.amountMinor)}</span>
            </p>
          ))}
          {sale.changeMinor > 0 ? (
            <p className="flex justify-between text-text-muted">
              <span>{t('sales.change')}</span>
              <span className="tabular-nums">{money(sale.changeMinor)}</span>
            </p>
          ) : null}
        </section>
        {sale.voidReason ? (
          <Text variant="muted">{t('sales.voidReason', { reason: sale.voidReason })}</Text>
        ) : null}
      </div>
    </Drawer>
  );
}
