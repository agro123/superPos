import { multiplyMoney, type CurrencyCode, type Money } from '@/shared/domain/money';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import type { ReceiptView } from '@/shared/lib/receipt';
import type { Sale } from '../domain/sale';

/** Ticket de una venta, formateado para mostrar, imprimir o compartir. */
export function saleReceipt(
  sale: Sale,
  businessName: string,
  currency: CurrencyCode,
  timeZone: string,
  customerName: string | null,
): ReceiptView {
  const money = (amount: Money) => formatMoney(amount, currency);
  return {
    title: businessName,
    subtitle: t('sales.receiptNumber', { number: sale.number }),
    lines: sale.lines
      .filter((line) => !line.voided)
      .map((line) => ({
        label: `${formatNumber(line.quantity)} × ${line.name}`,
        value: money(multiplyMoney(line.unitPriceMinor, line.quantity)),
      })),
    totals: [
      { label: t('pos.subtotal'), value: money(sale.subtotalMinor) },
      { label: t('pos.tax'), value: money(sale.taxMinor) },
      { label: t('pos.total'), value: money(sale.totalMinor), emphasis: true },
      ...sale.payments.map((p) => ({
        label: t(`payment.${p.method}`),
        value: money(p.amountMinor),
      })),
      ...(sale.changeMinor > 0
        ? [{ label: t('sales.change'), value: money(sale.changeMinor) }]
        : []),
    ],
    footer: [
      formatDateTime(sale.occurredAt, timeZone),
      ...(customerName ? [t('sales.customer', { name: customerName })] : []),
      t('sales.receiptThanks'),
    ],
  };
}
