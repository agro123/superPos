import {
  addMoney,
  subtractMoney,
  toMajorUnits,
  ZERO_MONEY,
  type CurrencyCode,
  type Money,
} from '@/shared/domain/money';
import { TENDER_METHODS, type TenderMethod } from '@/shared/domain/payment';

/** Venta con lo necesario para los análisis (ya sin anuladas). */
export interface InsightSale {
  number: string;
  occurredAt: Date;
  totalMinor: Money;
  changeMinor: Money;
  creditMinor: Money;
  customerId: string | null;
  createdBy: string;
  payments: readonly { method: TenderMethod; amountMinor: Money }[];
  lines: readonly {
    productId: string;
    name: string;
    quantity: number;
    unitPriceMinor: Money;
    /** Costo al vender; `null`/ausente en ventas antiguas. */
    unitCostMinor?: Money | null;
    voided: boolean;
  }[];
}

/** Hora local (0–23) en la zona del negocio (L11: se guarda en UTC, se muestra en la zona). */
export function hourInZone(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone,
  }).format(date);
  return Number(hour) % 24;
}

export interface HourTotal {
  hour: number;
  total: Money;
  count: number;
}

/** Ventas por hora del día (24 franjas): ¿cuándo se vende más? */
export function salesByHour(sales: readonly InsightSale[], timeZone: string): HourTotal[] {
  const buckets: HourTotal[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    total: ZERO_MONEY,
    count: 0,
  }));
  for (const sale of sales) {
    const bucket = buckets[hourInZone(sale.occurredAt, timeZone)];
    if (!bucket) continue;
    bucket.total = addMoney(bucket.total, sale.totalMinor);
    bucket.count += 1;
  }
  return buckets;
}

export interface MethodShare {
  method: TenderMethod;
  total: Money;
  /** 0–1 sobre el total vendido. */
  share: number;
}

/** Vendido por medio de pago (efectivo neto de vuelto; fiado aparte). */
export function paymentMix(sales: readonly InsightSale[]): MethodShare[] {
  const totals = new Map<TenderMethod, Money>(TENDER_METHODS.map((m) => [m, ZERO_MONEY]));
  for (const sale of sales) {
    for (const p of sale.payments)
      totals.set(p.method, addMoney(totals.get(p.method) ?? ZERO_MONEY, p.amountMinor));
    totals.set('cash', subtractMoney(totals.get('cash') ?? ZERO_MONEY, sale.changeMinor));
  }
  const grand = addMoney(...totals.values());
  return [...totals]
    .filter(([, total]) => total > 0)
    .map(([method, total]) => ({ method, total, share: grand > 0 ? total / grand : 0 }))
    .sort((a, b) => b.total - a.total);
}

const csvCell = (value: string) =>
  /[",\n;]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

/** CSV de ventas del periodo (separado por comas, montos en unidades mayores). */
export function salesCsv(
  sales: readonly InsightSale[],
  currency: CurrencyCode,
  formatDate: (date: Date) => string,
  workerName: (uid: string) => string,
): string {
  const header = [
    'numero',
    'fecha',
    'total',
    'medios',
    'fiado',
    'cliente',
    'vendedor',
    'productos',
  ];
  const rows = sales.map((sale) => [
    sale.number,
    formatDate(sale.occurredAt),
    String(toMajorUnits(sale.totalMinor, currency)),
    sale.payments.map((p) => p.method).join('+'),
    String(toMajorUnits(sale.creditMinor, currency)),
    sale.customerId ?? '',
    workerName(sale.createdBy),
    sale.lines
      .filter((l) => !l.voided)
      .map((l) => `${String(l.quantity)}x ${l.name}`)
      .join(' | '),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
