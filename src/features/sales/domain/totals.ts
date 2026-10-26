import {
  addMoney,
  applyRateBps,
  multiplyMoney,
  subtractMoney,
  taxIncludedIn,
  ZERO_MONEY,
  type Money,
} from '@/shared/domain/money';

/** Línea mínima para calcular totales. */
export interface TotalsLine {
  unitPrice: Money;
  quantity: number;
  taxRateBps: number;
  discount: Money;
  /** Las líneas anuladas no suman (L7). */
  voided: boolean;
}

export interface TaxBreakdown {
  rateBps: number;
  base: Money;
  tax: Money;
}

export interface Totals {
  /** Base gravable (sin impuestos, con descuentos). */
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  /** Lo que paga el cliente. */
  total: Money;
  itemCount: number;
  taxes: TaxBreakdown[];
}

export interface TotalsOptions {
  /** `true` si los precios ya incluyen impuesto. */
  pricesIncludeTax: boolean;
}

/**
 * Calcula los totales de una venta. Función pura, en enteros (L10) y sin ítems anulados (L7).
 * El impuesto se redondea por línea, como en el ticket.
 */
export function calculateTotals(lines: readonly TotalsLine[], options: TotalsOptions): Totals {
  const byRate = new Map<number, { base: Money; tax: Money }>();
  let subtotal = ZERO_MONEY;
  let discountTotal = ZERO_MONEY;
  let total = ZERO_MONEY;
  let itemCount = 0;

  for (const line of lines) {
    if (line.voided) continue;
    const gross = multiplyMoney(line.unitPrice, line.quantity);
    const discount = line.discount > gross ? gross : line.discount;
    const net = subtractMoney(gross, discount);
    const tax = options.pricesIncludeTax
      ? taxIncludedIn(net, line.taxRateBps)
      : applyRateBps(net, line.taxRateBps);
    const base = options.pricesIncludeTax ? subtractMoney(net, tax) : net;

    subtotal = addMoney(subtotal, base);
    discountTotal = addMoney(discountTotal, discount);
    total = addMoney(total, base, tax);
    itemCount += line.quantity;

    const current = byRate.get(line.taxRateBps) ?? { base: ZERO_MONEY, tax: ZERO_MONEY };
    byRate.set(line.taxRateBps, {
      base: addMoney(current.base, base),
      tax: addMoney(current.tax, tax),
    });
  }

  const taxes = [...byRate.entries()]
    .map(([rateBps, amounts]) => ({ rateBps, ...amounts }))
    .sort((a, b) => b.rateBps - a.rateBps);
  const taxTotal = addMoney(...taxes.map((entry) => entry.tax));
  return { subtotal, discountTotal, taxTotal, total, itemCount, taxes };
}
