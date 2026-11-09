import type { CurrencyCode } from '@/shared/domain/money';
import { multiplyMoney } from '@/shared/domain/money';
import { formatMoney, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { Badge, QuantityStepper, Text } from '@/shared/ui';
import { orderTotal, type OrderLine } from '../domain/order';

export interface OrderLinesPanelProps {
  lines: readonly OrderLine[];
  currency: CurrencyCode;
  /** Ronda ya servida (las anteriores o iguales se marcan como servidas). */
  servedRound: number;
  onQuantity: (lineId: string, quantity: number) => void;
}

/** Líneas de la comanda: pendientes (editables) y las ya enviadas por ronda. */
export function OrderLinesPanel({
  lines,
  currency,
  servedRound,
  onQuantity,
}: OrderLinesPanelProps) {
  const money = (amount: Parameters<typeof formatMoney>[0]) => formatMoney(amount, currency);
  const pending = lines.filter((l) => l.round === 0);
  const rounds = [...new Set(lines.filter((l) => l.round > 0).map((l) => l.round))].sort(
    (a, b) => a - b,
  );
  return (
    <div className="flex flex-col gap-4">
      {rounds.map((round) => (
        <section
          key={round}
          aria-label={t('restaurant.round', { round: String(round) })}
          className="flex flex-col gap-1"
        >
          <p className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase">
            {t('restaurant.round', { round: String(round) })}
            <Badge tone={round <= servedRound ? 'success' : 'warning'}>
              {round <= servedRound ? t('restaurant.order.served') : t('restaurant.order.sent')}
            </Badge>
          </p>
          {lines
            .filter((l) => l.round === round)
            .map((l) => (
              <p key={l.id} className="flex justify-between gap-2 text-sm text-text">
                <span>
                  {formatNumber(l.quantity)} × {l.name}
                  {l.notes ? (
                    <span className="block text-xs text-text-muted">{l.notes}</span>
                  ) : null}
                </span>
                <span className="tabular-nums">
                  {money(multiplyMoney(l.unitPriceMinor, l.quantity))}
                </span>
              </p>
            ))}
        </section>
      ))}
      <section aria-label={t('restaurant.pending')} className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-text-muted uppercase">{t('restaurant.pending')}</p>
        {pending.length === 0 ? <Text variant="caption">{t('restaurant.noPending')}</Text> : null}
        {pending.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-text">{l.name}</span>
            <QuantityStepper
              value={l.quantity}
              onValueChange={(q) => {
                onQuantity(l.id, q);
              }}
              itemName={l.name}
              min={0}
              max={99}
            />
          </div>
        ))}
      </section>
      <p className="flex justify-between border-t border-border pt-2 text-base font-semibold text-text">
        <span>{t('pos.total')}</span>
        <span className="tabular-nums">{money(orderTotal(lines))}</span>
      </p>
    </div>
  );
}
