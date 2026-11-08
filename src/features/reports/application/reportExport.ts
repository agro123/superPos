import { money, toMajorUnits, type CurrencyCode, type Money } from '@/shared/domain/money';
import {
  buildTablesPdf,
  buildXlsx,
  downloadBlob,
  XLSX_TYPE,
  type Cell,
  type Sheet,
} from '@/shared/lib/exportFiles';
import { formatDate, formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import type { useReportsData } from './useReportsData';

type ReportsData = ReturnType<typeof useReportsData>;

export interface ExportContext {
  businessName: string;
  currency: CurrencyCode;
  timeZone: string;
  days: number;
}

const pct = (value: number) => Math.round(value * 1000) / 10;

/** Hojas del reporte del periodo: montos en unidades mayores (números, no texto). */
export function reportSheets(data: ReportsData, ctx: ExportContext): Sheet[] {
  const m = (amount: Money | number) => toMajorUnits(money(Math.round(amount)), ctx.currency);
  const p = data.profit;
  return [
    {
      name: t('reports.sheet.summary'),
      columns: [t('reports.sheet.metric'), t('reports.sheet.value')],
      rows: [
        [t('reports.total'), m(data.summary.total)],
        [t('reports.count'), data.summary.count],
        [t('reports.average'), m(data.summary.averageTicket)],
        [t('reports.profit.grossMargin'), m(p.grossMargin)],
        [t('reports.profit.expenses'), m(p.expenses)],
        [t('reports.profit.shrinkage'), m(p.shrinkage)],
        [t('reports.profit.result'), m(p.result)],
        [t('reports.profit.coverage'), pct(p.coverage)],
      ],
    },
    {
      name: t('reports.byDay'),
      columns: [t('reports.day'), t('common.total'), t('reports.count')],
      rows: data.byDay.map((d) => [formatDate(d.day, ctx.timeZone), m(d.total), d.count]),
    },
    {
      name: t('reports.byHour'),
      columns: [t('reports.hour'), t('common.total'), t('reports.count')],
      rows: data.hours.map((h) => [`${String(h.hour).padStart(2, '0')}:00`, m(h.total), h.count]),
    },
    {
      name: t('reports.paymentMix'),
      columns: [t('ui.payment.method'), t('common.total'), '%'],
      rows: data.mix.map((x) => [t(`payment.${x.method}`), m(x.total), pct(x.share)]),
    },
    {
      name: t('reports.topProducts'),
      columns: [t('inventory.product'), t('reports.sheet.units')],
      rows: data.top.map((x) => [x.name, x.quantity]),
    },
    {
      name: t('reports.profit.byProduct'),
      columns: [
        t('inventory.product'),
        t('reports.sheet.units'),
        t('reports.profit.revenue'),
        t('reports.profit.cost'),
        t('reports.profit.margin'),
        '%',
      ],
      rows: p.byProduct.map((l) => [
        l.name,
        l.quantity,
        m(l.revenue),
        m(l.cost),
        m(l.margin),
        l.revenue > 0 ? pct(l.margin / l.revenue) : 0,
      ]),
    },
    {
      name: t('reports.profit.byCategory'),
      columns: [
        t('reports.profit.category'),
        t('reports.profit.revenue'),
        t('reports.profit.cost'),
        t('reports.profit.margin'),
      ],
      rows: p.byCategory.map((l) => [l.name, m(l.revenue), m(l.cost), m(l.margin)]),
    },
    {
      name: t('reports.perf.title'),
      columns: [
        t('cash.col.worker'),
        t('reports.count'),
        t('common.total'),
        t('reports.average'),
        t('reports.perf.unitsPerSale'),
        t('reports.perf.voided'),
        t('reports.perf.credit'),
        '%',
      ],
      rows: data.performance.map((r) => [
        data.workerName(r.uid),
        r.salesCount,
        m(r.total),
        m(r.averageTicket),
        r.unitsPerSale,
        r.voidedCount,
        m(r.creditGiven),
        pct(r.share),
      ]),
    },
    {
      name: t('cash.report.title'),
      columns: [
        t('cash.col.worker'),
        t('cash.col.sales'),
        t('cash.cashIn'),
        t('cash.col.change'),
        t('cash.col.expenses'),
        t('cash.col.collected'),
        t('cash.col.difference'),
      ],
      rows: data.cashRows.map((r) => [
        data.workerName(r.uid),
        r.salesCount,
        m(r.cashIn),
        m(r.changeGiven),
        m(r.expenses),
        m(r.creditCollected),
        m(r.difference),
      ]),
    },
  ];
}

const fileBase = (ctx: ExportContext) => `reporte-${String(ctx.days)}-dias`;

export function exportExcel(data: ReportsData, ctx: ExportContext): void {
  const bytes = buildXlsx(reportSheets(data, ctx));
  downloadBlob(new Blob([new Uint8Array(bytes)], { type: XLSX_TYPE }), `${fileBase(ctx)}.xlsx`);
}

/** En el PDF los números van formateados (separador de miles) para leerlos impresos. */
export async function exportPdf(data: ReportsData, ctx: ExportContext): Promise<void> {
  const format = (cell: Cell): Cell => (typeof cell === 'number' ? formatNumber(cell) : cell);
  const sections = reportSheets(data, ctx).map((sheet) => ({
    ...sheet,
    rows: sheet.rows.map((row) => row.map(format)),
  }));
  const blob = await buildTablesPdf({
    title: t('reports.pdfTitle', { business: ctx.businessName }),
    subtitle: t('reports.pdfSubtitle', { days: String(ctx.days), currency: ctx.currency }),
    sections,
  });
  downloadBlob(blob, `${fileBase(ctx)}.pdf`);
}
