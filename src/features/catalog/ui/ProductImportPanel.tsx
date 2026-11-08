import { FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth';
import { useActiveBusiness } from '@/features/business';
import { useOnlineStatus } from '@/shared/hooks/useSyncSummary';
import { useToast } from '@/shared/hooks/useToast';
import { buildXlsx, downloadBlob, XLSX_TYPE } from '@/shared/lib/exportFiles';
import { formatNumber } from '@/shared/lib/formatters';
import { t } from '@/shared/lib/i18n';
import { parseCsv, readXlsx } from '@/shared/lib/importFiles';
import { Badge, Button, Skeleton, Text } from '@/shared/ui';
import { catalogWrites, useCategories, useProducts } from '../application/useCatalog';
import {
  IMPORT_COLUMNS,
  IMPORT_EXAMPLES,
  planProductImport,
  type ImportPlan,
} from '../domain/productImport';

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** Importación masiva: plantilla Excel/CSV → vista previa (nuevos, existentes, errores) → crear. */
export function ProductImportPanel() {
  const { business } = useActiveBusiness();
  const user = useCurrentUser();
  const toast = useToast();
  const online = useOnlineStatus();
  const products = useProducts(business.id);
  const categories = useCategories(business.id);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  if (products.isPending || categories.isPending) return <Skeleton className="h-64" />;

  const downloadTemplate = (kind: 'xlsx' | 'csv') => {
    if (kind === 'xlsx') {
      const bytes = buildXlsx([
        { name: t('import.sheetName'), columns: [...IMPORT_COLUMNS], rows: IMPORT_EXAMPLES },
      ]);
      downloadBlob(
        new Blob([new Uint8Array(bytes)], { type: XLSX_TYPE }),
        'plantilla-productos.xlsx',
      );
    } else {
      // `;` y BOM: Excel en español lo abre en columnas y con tildes.
      const csv = [IMPORT_COLUMNS, ...IMPORT_EXAMPLES]
        .map((row) => row.map(csvCell).join(';'))
        .join('\n');
      downloadBlob(
        new Blob([String.fromCharCode(0xfeff), csv], { type: 'text/csv;charset=utf-8' }),
        'plantilla-productos.csv',
      );
    }
  };

  const readFile = async (file: File) => {
    setReading(true);
    setFileName(file.name);
    try {
      const rows = file.name.toLowerCase().endsWith('.xlsx')
        ? readXlsx(new Uint8Array(await file.arrayBuffer()))
        : parseCsv(await file.text());
      setPlan(
        planProductImport(rows, {
          currency: business.currency,
          existing: products.data ?? [],
          categories: categories.data ?? [],
        }),
      );
    } catch {
      setPlan(null);
      toast({ title: t('import.unreadable'), tone: 'danger' });
    } finally {
      setReading(false);
    }
  };

  const issue = (message: string) =>
    message === 'duplicate'
      ? t('import.duplicate')
      : message === 'missingColumns'
        ? t('import.missingColumns')
        : t('import.invalidField', { field: message });

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="template" className="flex flex-col gap-2">
        <h3 id="template" className="text-base font-semibold text-text">
          {t('import.step1')}
        </h3>
        <Text variant="caption">
          {t('import.columnsHint', { columns: IMPORT_COLUMNS.join(', ') })}
        </Text>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<FileSpreadsheet aria-hidden className="size-5" />}
            onClick={() => {
              downloadTemplate('xlsx');
            }}
          >
            {t('import.templateExcel')}
          </Button>
          <Button
            variant="outline"
            leftIcon={<FileText aria-hidden className="size-5" />}
            onClick={() => {
              downloadTemplate('csv');
            }}
          >
            {t('import.templateCsv')}
          </Button>
        </div>
      </section>
      <section aria-labelledby="upload" className="flex flex-col gap-2">
        <h3 id="upload" className="text-base font-semibold text-text">
          {t('import.step2')}
        </h3>
        <label className="flex min-h-touch cursor-pointer items-center gap-2 self-start rounded-md border border-dashed border-border-strong px-4 py-3 text-sm text-text hover:bg-surface-muted">
          <Upload aria-hidden className="size-5" />
          {fileName ?? t('import.choose')}
          <input
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-label={t('import.choose')}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
              event.target.value = '';
            }}
          />
        </label>
        {reading ? <Skeleton className="h-16" /> : null}
      </section>
      {plan ? (
        <section aria-labelledby="preview" className="flex flex-col gap-3">
          <h3 id="preview" className="text-base font-semibold text-text">
            {t('import.step3')}
          </h3>
          <div role="status" className="flex flex-wrap gap-2">
            <Badge tone="success">
              {t('import.toCreate', { count: formatNumber(plan.toCreate.length) })}
            </Badge>
            <Badge tone="neutral">
              {t('import.skipped', { count: formatNumber(plan.duplicates.length) })}
            </Badge>
            <Badge tone={plan.errors.length > 0 ? 'danger' : 'neutral'}>
              {t('import.errors', { count: formatNumber(plan.errors.length) })}
            </Badge>
            {plan.newCategories.length > 0 ? (
              <Badge tone="info">
                {t('import.newCategories', { names: plan.newCategories.join(', ') })}
              </Badge>
            ) : null}
          </div>
          {[...plan.errors, ...plan.duplicates].length > 0 ? (
            <ul
              aria-label={t('import.issues')}
              className="flex max-h-60 flex-col gap-1 overflow-y-auto rounded-md border border-border p-3 text-sm"
            >
              {[...plan.errors, ...plan.duplicates]
                .sort((a, b) => a.row - b.row)
                .map((item) => (
                  <li key={`${String(item.row)}-${item.message}`}>
                    {t('import.issueLine', {
                      row: String(item.row),
                      name: item.name || '—',
                      message: issue(item.message),
                    })}
                  </li>
                ))}
            </ul>
          ) : null}
          <Button
            className="self-start"
            disabled={plan.toCreate.length === 0}
            onClick={() => {
              const count = catalogWrites.importProducts(
                business.id,
                {
                  products: plan.toCreate,
                  newCategories: plan.newCategories,
                  categories: categories.data ?? [],
                },
                user.uid,
              );
              toast({
                title: t('import.done', { count: formatNumber(count) }),
                description: online ? undefined : t('common.savedOffline'),
                tone: 'success',
              });
              setPlan(null);
              setFileName(null);
            }}
          >
            {t('import.confirm', { count: formatNumber(plan.toCreate.length) })}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
