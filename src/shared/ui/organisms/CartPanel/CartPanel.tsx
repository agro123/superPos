import { ShoppingCart, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { plural, t } from '@/shared/lib/i18n';
import { Button } from '../../atoms/Button';
import { IconButton } from '../../atoms/IconButton';
import { EmptyState } from '../../molecules/EmptyState';
import { QuantityStepper } from '../../molecules/QuantityStepper';

export interface CartPanelLine {
  id: string;
  name: string;
  quantity: number;
  unitPriceLabel: string;
  totalLabel: string;
}

export interface CartPanelTotal {
  label: string;
  value: string;
  /** Resalta la fila (total a pagar). */
  emphasis?: boolean;
}

export interface CartPanelProps {
  lines: readonly CartPanelLine[];
  totals: readonly CartPanelTotal[];
  onQuantityChange: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  onClear?: () => void;
  onCheckout: () => void;
  checkoutLabel: string;
  checkoutDisabled?: boolean;
  /** Contenido extra bajo el título (cliente, mesa…). */
  header?: ReactNode;
  className?: string;
}

/** Carrito del POS: líneas con cantidad, totales y botón de cobro. */
export function CartPanel({
  lines,
  totals,
  onQuantityChange,
  onRemove,
  onClear,
  onCheckout,
  checkoutLabel,
  checkoutDisabled = false,
  header,
  className,
}: CartPanelProps) {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <section
      aria-label={t('ui.cart.title')}
      className={cn('flex h-full flex-col bg-surface', className)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <div>
          <h2 className="text-lg font-semibold text-text">{t('ui.cart.title')}</h2>
          <p className="text-xs text-text-subtle">
            {plural(itemCount, 'ui.cart.itemsOne', 'ui.cart.items')}
          </p>
        </div>
        {onClear && lines.length > 0 ? (
          <IconButton
            label={t('ui.cart.clear')}
            icon={<Trash2 />}
            variant="danger"
            onClick={onClear}
          />
        ) : null}
      </div>
      {header ? <div className="border-b border-border px-4 py-2">{header}</div> : null}
      {lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title={t('ui.cart.empty')}
          description={t('ui.cart.emptyHint')}
          className="flex-1"
        />
      ) : (
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {lines.map((line) => (
            <li key={line.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{line.name}</p>
                  <p className="text-xs text-text-subtle tabular-nums">{line.unitPriceLabel}</p>
                </div>
                <p className="text-sm font-semibold text-text tabular-nums">{line.totalLabel}</p>
              </div>
              <div className="flex items-center justify-between">
                <QuantityStepper
                  value={line.quantity}
                  min={1}
                  itemName={line.name}
                  onValueChange={(quantity) => {
                    onQuantityChange(line.id, quantity);
                  }}
                />
                <IconButton
                  label={t('ui.remove', { name: line.name })}
                  icon={<Trash2 />}
                  onClick={() => {
                    onRemove(line.id);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-3 border-t border-border p-4">
        <dl className="flex flex-col gap-1 text-sm">
          {totals.map((total) => (
            <div
              key={total.label}
              className={cn(
                'flex justify-between',
                total.emphasis ? 'text-lg font-semibold text-text' : 'text-text-muted',
              )}
            >
              <dt>{total.label}</dt>
              <dd className="tabular-nums">{total.value}</dd>
            </div>
          ))}
        </dl>
        <Button
          size="lg"
          fullWidth
          disabled={checkoutDisabled || lines.length === 0}
          onClick={onCheckout}
        >
          {checkoutLabel}
        </Button>
      </div>
    </section>
  );
}
