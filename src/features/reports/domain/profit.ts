import { addMoney, multiplyMoney, ZERO_MONEY, type Money } from '@/shared/domain/money';
import type { InsightSale } from './insights';

export interface ProfitLine {
  key: string;
  name: string;
  quantity: number;
  revenue: Money;
  cost: Money;
  /** Puede ser negativo (se vende por debajo del costo). */
  margin: number;
}

export interface ProfitReport {
  revenue: Money;
  /** Ingresos de líneas con costo conocido (base del margen). */
  costedRevenue: Money;
  cost: Money;
  grossMargin: number;
  expenses: Money;
  /** Merma: ajustes de inventario negativos valorados al costo actual. */
  shrinkage: Money;
  /** Margen bruto − gastos de caja − merma. */
  result: number;
  /** Parte de los ingresos con costo conocido (0–1). */
  coverage: number;
  byProduct: ProfitLine[];
  byCategory: ProfitLine[];
  /** Productos vendidos por debajo del costo. */
  losing: ProfitLine[];
  /** Productos vendidos sin costo registrado (no entran al margen). */
  withoutCost: { productId: string; name: string; revenue: Money }[];
}

export interface ProfitInputs {
  sales: readonly InsightSale[];
  /** Costo actual del catálogo (respaldo para ventas sin costo guardado). */
  currentCost: (productId: string) => Money | null;
  categoryOf: (productId: string) => string | null;
  expenses: readonly Money[];
  /** Ajustes de inventario del periodo (`quantityDelta` negativo = salida). */
  adjustments: readonly { productId: string; quantityDelta: number }[];
}

function add(
  map: Map<string, ProfitLine>,
  key: string,
  name: string,
  quantity: number,
  revenue: Money,
  cost: Money,
) {
  const line = map.get(key) ?? {
    key,
    name,
    quantity: 0,
    revenue: ZERO_MONEY,
    cost: ZERO_MONEY,
    margin: 0,
  };
  line.quantity += quantity;
  line.revenue = addMoney(line.revenue, revenue);
  line.cost = addMoney(line.cost, cost);
  line.margin = line.revenue - line.cost;
  map.set(key, line);
}

/**
 * Dónde se gana o se pierde: margen por producto y categoría (con el costo guardado en la venta o,
 * si no lo hay, el actual), gastos de caja y merma de inventario, y un resultado estimado.
 */
export function profitReport({
  sales,
  currentCost,
  categoryOf,
  expenses,
  adjustments,
}: ProfitInputs): ProfitReport {
  const products = new Map<string, ProfitLine>();
  const categories = new Map<string, ProfitLine>();
  const uncosted = new Map<string, { productId: string; name: string; revenue: Money }>();
  let revenue = ZERO_MONEY;
  for (const line of sales.flatMap((s) => s.lines)) {
    if (line.voided) continue;
    const lineRevenue = multiplyMoney(line.unitPriceMinor, line.quantity);
    revenue = addMoney(revenue, lineRevenue);
    const unitCost = line.unitCostMinor ?? currentCost(line.productId);
    if (unitCost === null) {
      const current = uncosted.get(line.productId) ?? {
        productId: line.productId,
        name: line.name,
        revenue: ZERO_MONEY,
      };
      current.revenue = addMoney(current.revenue, lineRevenue);
      uncosted.set(line.productId, current);
      continue;
    }
    const cost = multiplyMoney(unitCost, line.quantity);
    add(products, line.productId, line.name, line.quantity, lineRevenue, cost);
    const category = categoryOf(line.productId) ?? '—';
    add(categories, category, category, line.quantity, lineRevenue, cost);
  }
  const byProduct = [...products.values()].sort((a, b) => b.margin - a.margin);
  const costedRevenue = addMoney(...byProduct.map((l) => l.revenue));
  const cost = addMoney(...byProduct.map((l) => l.cost));
  const grossMargin = costedRevenue - cost;
  const expensesTotal = addMoney(...expenses);
  const shrinkage = addMoney(
    ...adjustments
      .filter((a) => a.quantityDelta < 0)
      .map((a) => multiplyMoney(currentCost(a.productId) ?? ZERO_MONEY, -a.quantityDelta)),
  );
  return {
    revenue,
    costedRevenue,
    cost,
    grossMargin,
    expenses: expensesTotal,
    shrinkage,
    result: grossMargin - expensesTotal - shrinkage,
    coverage: revenue > 0 ? costedRevenue / revenue : 0,
    byProduct,
    byCategory: [...categories.values()].sort((a, b) => b.margin - a.margin),
    losing: byProduct.filter((l) => l.margin < 0).sort((a, b) => a.margin - b.margin),
    withoutCost: [...uncosted.values()].sort((a, b) => b.revenue - a.revenue),
  };
}
