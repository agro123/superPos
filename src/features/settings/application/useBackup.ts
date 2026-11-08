import { useActiveBusiness, usePlan } from '@/features/business';
import { useCategories, useProducts } from '@/features/catalog';
import { useCustomers } from '@/features/customers';
import { useSalesSince } from '@/features/sales';
import { toMajorUnits, type Money } from '@/shared/domain/money';
import { buildXlsx, downloadBlob, XLSX_TYPE } from '@/shared/lib/exportFiles';
import { formatDateTime } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';

/**
 * Respaldo completo en Excel (premium): catálogo, clientes y las ventas del último año. Los datos
 * ya están en la nube; el respaldo es una copia que el dueño guarda por su cuenta.
 */
export function useBackup() {
  const { business, modules } = useActiveBusiness();
  const { limits } = usePlan();
  const products = useProducts(business.id);
  const categories = useCategories(business.id);
  const customers = useCustomers(business.id, modules.customers && limits.exports);
  const sales = useSalesSince(business.id, limits.exports ? 365 : 1);
  const m = (amount: Money | null) =>
    amount === null ? '' : toMajorUnits(amount, business.currency);
  const category = (id: string | null) => categories.data?.find((c) => c.id === id)?.name ?? '';

  const download = () => {
    const bytes = buildXlsx([
      {
        name: t('nav.catalog'),
        columns: [
          'nombre',
          'precio',
          'costo',
          'categoria',
          'sku',
          'codigo_barras',
          'stock',
          'activo',
        ],
        rows: (products.data ?? []).map((p) => [
          p.name,
          m(p.priceMinor),
          m(p.costMinor),
          category(p.categoryId),
          p.sku ?? '',
          p.barcode ?? '',
          p.stock,
          p.active ? 'si' : 'no',
        ]),
      },
      {
        name: t('nav.customers'),
        columns: ['nombre', 'documento', 'telefono', 'email', 'notas'],
        rows: (customers.data ?? []).map((c) => [
          c.name,
          c.documentId ?? '',
          c.phone ?? '',
          c.email ?? '',
          c.notes ?? '',
        ]),
      },
      {
        name: t('nav.sales'),
        columns: ['numero', 'fecha', 'tipo', 'total', 'medios', 'fiado', 'cliente', 'productos'],
        rows: (sales.query.data ?? []).map((s) => [
          s.number,
          formatDateTime(s.occurredAt, business.timezone),
          s.type,
          m(s.totalMinor),
          s.payments.map((p) => p.method).join('+'),
          m(s.creditMinor),
          s.customerId ?? '',
          s.lines.map((l) => `${String(l.quantity)}x ${l.name}`).join(' | '),
        ]),
      },
    ]);
    downloadBlob(
      new Blob([new Uint8Array(bytes)], { type: XLSX_TYPE }),
      `respaldo-${business.id}.xlsx`,
    );
  };

  return { download, loading: products.isPending || sales.query.isPending };
}
