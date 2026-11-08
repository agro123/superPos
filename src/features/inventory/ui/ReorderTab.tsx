import { PackageCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import {
  emailComposeUrl,
  normalizeWhatsapp,
  whatsappUrl,
  type EmailProvider,
} from '@/shared/lib/share';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Select,
  Text,
  type DataTableColumn,
} from '@/shared/ui';
import { useReorder } from '../application/useInventory';
import { purchaseOrderText, type ReorderRow } from '../domain/reorder';
import type { Supplier } from '../domain/stock';

export interface ReorderTabProps {
  businessId: string;
  businessName: string;
  suppliers: readonly Supplier[];
  email: { provider: EmailProvider; customUrl: string | null };
}

const COVER_OPTIONS = [7, 14, 30] as const;
const TONES = { out: 'danger', low: 'warning', soon: 'info' } as const;

/** Qué pedir y cuánto (ritmo de ventas de 14 días), con envío del pedido al proveedor. */
export function ReorderTab({ businessId, businessName, suppliers, email }: ReorderTabProps) {
  const [coverDays, setCoverDays] = useState<number>(14);
  const options = useMemo(() => ({ periodDays: 14, coverDays, leadDays: 3 }), [coverDays]);
  const { rows, loading } = useReorder(businessId, options);
  const [supplierId, setSupplierId] = useState('none');
  const supplier = suppliers.find((s) => s.id === supplierId) ?? null;
  const text = purchaseOrderText(
    businessName,
    supplier?.name ?? null,
    rows.map((r) => ({ name: r.name, quantity: r.suggested })),
  );
  const columns: DataTableColumn<ReorderRow>[] = [
    { id: 'name', header: t('common.name'), cell: (r) => r.name },
    {
      id: 'urgency',
      header: t('common.status'),
      cell: (r) => <Badge tone={TONES[r.urgency]}>{t(`inventory.urgency.${r.urgency}`)}</Badge>,
    },
    {
      id: 'stock',
      header: t('catalog.col.stock'),
      align: 'right',
      cell: (r) => formatNumber(r.stock),
    },
    {
      id: 'rate',
      header: t('inventory.dailyRate'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => formatNumber(Math.round(r.dailyRate * 10) / 10),
    },
    {
      id: 'daysLeft',
      header: t('inventory.daysLeft'),
      align: 'right',
      hideOnMobile: true,
      cell: (r) => (r.daysLeft === null ? '—' : formatNumber(Math.floor(r.daysLeft))),
    },
    {
      id: 'suggested',
      header: t('inventory.suggested'),
      align: 'right',
      cell: (r) => <strong>{formatNumber(r.suggested)}</strong>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Text variant="muted">{t('inventory.reorderHint')}</Text>
      <div className="flex flex-wrap items-end gap-2">
        <Select
          aria-label={t('inventory.coverDays')}
          className="sm:w-56"
          value={String(coverDays)}
          onValueChange={(v) => {
            setCoverDays(Number(v));
          }}
          options={COVER_OPTIONS.map((d) => ({
            value: String(d),
            label: t('inventory.coverFor', { days: d }),
          }))}
        />
        <Select
          aria-label={t('inventory.supplier')}
          className="sm:w-56"
          value={supplierId}
          onValueChange={setSupplierId}
          options={[
            { value: 'none', label: t('inventory.anySupplier') },
            ...suppliers.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        {rows.length > 0 ? (
          <>
            <Button asChild>
              <a
                href={whatsappUrl(text, supplier?.phone ? normalizeWhatsapp(supplier.phone) : null)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('inventory.orderWhatsapp')}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={emailComposeUrl(
                  email.provider,
                  {
                    to: supplier?.email ?? '',
                    subject: t('inventory.orderSubject', { name: businessName }),
                    body: text,
                  },
                  email.customUrl,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('inventory.orderEmail')}
              </a>
            </Button>
          </>
        ) : null}
      </div>
      <DataTable
        caption={t('inventory.reorderTable')}
        columns={columns}
        rows={rows}
        getRowId={(r) => r.productId}
        loading={loading}
        emptyState={<EmptyState icon={<PackageCheck />} title={t('inventory.nothingToReorder')} />}
      />
    </div>
  );
}
