import { useState, type ReactNode } from 'react';
import { multiplyMoney, type CurrencyCode, type Money } from '@/shared/domain/money';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { CartPanel, ConfirmDialog } from '@/shared/ui';
import type { CartLine } from '../domain/cart';
import type { Totals } from '../domain/totals';

export interface PosCartProps {
  lines: readonly CartLine[];
  totals: Totals;
  currency: CurrencyCode;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  /** Pestañas de órdenes u otro contenido bajo el título. */
  header?: ReactNode;
}

/** Carrito del POS: conecta las líneas del dominio con el organismo `CartPanel`. */
export function PosCart({
  lines,
  totals,
  currency,
  onQuantityChange,
  onRemove,
  onClear,
  onCheckout,
  header,
}: PosCartProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const money = (amount: Money) => formatMoney(amount, currency);
  return (
    <>
      <CartPanel
        lines={lines.map((line) => ({
          id: line.productId,
          name: line.name,
          quantity: line.quantity,
          unitPriceLabel: t('sales.unitPrice', {
            quantity: formatNumber(line.quantity),
            price: money(line.unitPrice),
          }),
          totalLabel: money(multiplyMoney(line.unitPrice, line.quantity)),
        }))}
        totals={[
          { label: t('pos.subtotal'), value: money(totals.subtotal) },
          { label: t('pos.tax'), value: money(totals.taxTotal) },
          { label: t('pos.total'), value: money(totals.total), emphasis: true },
        ]}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        onClear={() => {
          setConfirmClear(true);
        }}
        onCheckout={onCheckout}
        header={header}
        checkoutLabel={t('pos.charge', { amount: money(totals.total) })}
      />
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={t('pos.clearConfirm')}
        description={t('pos.clearHint')}
        confirmLabel={t('pos.clear')}
        tone="danger"
        onConfirm={() => {
          onClear();
          setConfirmClear(false);
        }}
      />
    </>
  );
}
