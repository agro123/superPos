import { addMoney, subtractMoney, ZERO_MONEY, type Money } from '@/shared/domain/money';
import type { TenderMethod } from '@/shared/domain/payment';
import type { CashShift, Expense, ShiftCreditPayment, ShiftSale } from './cashShift';

export type MovementKind = 'open' | 'sale' | 'void' | 'expense' | 'creditPayment' | 'close';

/** Un movimiento de caja atribuido a quien lo hizo. */
export interface CashMovement {
  id: string;
  shiftId: string;
  kind: MovementKind;
  /** uid del trabajador. */
  by: string;
  at: Date;
  /** Efectivo que entra al cajón (venta en efectivo, abono, base). */
  cashIn: Money;
  /** Efectivo que sale (vuelto, gasto). */
  cashOut: Money;
  /** Montos por método de la venta o del abono (sin efectivo neto). */
  methods: Partial<Record<TenderMethod, Money>>;
  /** Número de venta, descripción del gasto… */
  reference: string | null;
  /** Solo en `close`: contado − esperado (negativo = faltante). */
  difference: number | null;
  /** Venta que después se anuló: se muestra, pero no suma al efectivo esperado. */
  voided: boolean;
}

export interface ShiftActivity {
  shift: CashShift;
  sales: readonly ShiftSale[];
  expenses: readonly Expense[];
  creditPayments: readonly ShiftCreditPayment[];
}

const methodsOf = (payments: ShiftSale['payments']) => {
  const result: Partial<Record<TenderMethod, Money>> = {};
  for (const p of payments)
    result[p.method] = addMoney(result[p.method] ?? ZERO_MONEY, p.amountMinor);
  return result;
};

/** Línea de tiempo de un turno: apertura, ventas, anulaciones, gastos, abonos y cierre. */
export function shiftMovements({
  shift,
  sales,
  expenses,
  creditPayments,
}: ShiftActivity): CashMovement[] {
  const base = { shiftId: shift.id, methods: {}, reference: null, difference: null, voided: false };
  const voidedIds = new Set(
    sales.flatMap((s) => (s.type === 'void' && s.voidedSaleId ? [s.voidedSaleId] : [])),
  );
  const movements: CashMovement[] = [
    {
      ...base,
      id: `${shift.id}-open`,
      kind: 'open',
      by: shift.openedBy,
      at: shift.openedAt,
      cashIn: shift.openingFloatMinor,
      cashOut: ZERO_MONEY,
    },
  ];
  for (const sale of sales) {
    const cash = sale.payments.filter((p) => p.method === 'cash').map((p) => p.amountMinor);
    const isVoid = sale.type === 'void';
    movements.push({
      ...base,
      id: sale.id,
      kind: isVoid ? 'void' : 'sale',
      by: sale.createdBy,
      at: sale.occurredAt,
      // Una anulación no mueve efectivo por sí sola: se descuenta del esperado.
      cashIn: isVoid ? ZERO_MONEY : addMoney(...cash),
      cashOut: isVoid ? ZERO_MONEY : sale.changeMinor,
      methods: methodsOf(sale.payments),
      reference: sale.number,
      voided: voidedIds.has(sale.id),
    });
  }
  for (const expense of expenses) {
    movements.push({
      ...base,
      id: expense.id,
      kind: 'expense',
      by: expense.createdBy,
      at: expense.createdAt,
      cashIn: ZERO_MONEY,
      cashOut: expense.amountMinor,
      reference: expense.description,
    });
  }
  for (const payment of creditPayments) {
    movements.push({
      ...base,
      id: payment.id,
      kind: 'creditPayment',
      by: payment.createdBy,
      at: payment.occurredAt,
      cashIn: payment.method === 'cash' ? payment.amountMinor : ZERO_MONEY,
      cashOut: ZERO_MONEY,
      methods: { [payment.method]: payment.amountMinor },
    });
  }
  if (shift.status === 'closed' && shift.closedBy && shift.closedAt) {
    movements.push({
      ...base,
      id: `${shift.id}-close`,
      kind: 'close',
      by: shift.closedBy,
      at: shift.closedAt,
      cashIn: ZERO_MONEY,
      cashOut: ZERO_MONEY,
      difference:
        shift.countedCashMinor !== null && shift.expectedCashMinor !== null
          ? subtractMoney(shift.countedCashMinor, shift.expectedCashMinor)
          : null,
    });
  }
  return movements.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Totales de caja por trabajador. */
export interface WorkerCashSummary {
  uid: string;
  shiftsOpened: number;
  shiftsClosed: number;
  salesCount: number;
  voidsCount: number;
  /** Efectivo de ventas y abonos (sin base). */
  cashIn: Money;
  changeGiven: Money;
  expenses: Money;
  byMethod: Partial<Record<TenderMethod, Money>>;
  creditCollected: Money;
  /** Suma de diferencias de arqueo en los turnos que cerró (negativo = faltante). */
  difference: number;
}

/**
 * Agrega movimientos por trabajador. Una venta anulada no suma montos (igual que en el arqueo):
 * la anulación se cuenta a quien anuló.
 */
export function cashByWorker(movements: readonly CashMovement[]): WorkerCashSummary[] {
  const rows = new Map<string, WorkerCashSummary>();
  const row = (uid: string) => {
    let current = rows.get(uid);
    if (!current) {
      current = {
        uid,
        shiftsOpened: 0,
        shiftsClosed: 0,
        salesCount: 0,
        voidsCount: 0,
        cashIn: ZERO_MONEY,
        changeGiven: ZERO_MONEY,
        expenses: ZERO_MONEY,
        byMethod: {},
        creditCollected: ZERO_MONEY,
        difference: 0,
      };
      rows.set(uid, current);
    }
    return current;
  };
  for (const m of movements) {
    const r = row(m.by);
    if (m.kind === 'open') r.shiftsOpened += 1;
    else if (m.kind === 'close') {
      r.shiftsClosed += 1;
      r.difference += m.difference ?? 0;
    } else if (m.kind === 'void') r.voidsCount += 1;
    else if (m.kind === 'expense') r.expenses = addMoney(r.expenses, m.cashOut);
    else if (!m.voided) {
      r.cashIn = addMoney(r.cashIn, m.cashIn);
      if (m.kind === 'sale') {
        r.salesCount += 1;
        r.changeGiven = addMoney(r.changeGiven, m.cashOut);
        for (const [method, amount] of Object.entries(m.methods) as [TenderMethod, Money][]) {
          r.byMethod[method] = addMoney(r.byMethod[method] ?? ZERO_MONEY, amount);
        }
      } else {
        r.creditCollected = addMoney(r.creditCollected, ...Object.values(m.methods));
      }
    }
  }
  return [...rows.values()];
}
