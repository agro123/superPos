import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n';
import { Button } from '../../atoms/Button';
import { Skeleton } from '../../atoms/Skeleton';
import { SearchBar } from '../../molecules/SearchBar';
import { filterRows, nextSort, paginate, sortRows, type SortState } from './dataTableModel';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Si se define, la columna se puede ordenar. */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right';
  /** Oculta la columna en pantallas pequeñas. */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  /** Nombre accesible de la tabla. */
  caption: string;
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  /** Texto en el que busca el buscador. Sin esto no hay buscador. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Abre el detalle; la primera celda se vuelve un botón que cubre la fila. */
  onRowClick?: (row: T) => void;
  pageSize?: number;
  loading?: boolean;
  /** Contenido cuando no hay filas (sin búsqueda activa). */
  emptyState?: ReactNode;
  /** Controles extra junto al buscador (filtros). */
  toolbar?: ReactNode;
}

/** Tabla con búsqueda, orden y paginación en cliente. Recibe los datos ya cargados. */
export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  searchText,
  searchPlaceholder,
  onRowClick,
  pageSize = 20,
  loading = false,
  emptyState,
  toolbar,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const filtered = searchText ? filterRows(rows, query, searchText) : rows;
    const sortColumn = columns.find((column) => column.id === sort?.columnId);
    const sorted =
      sort && sortColumn?.sortValue
        ? sortRows(filtered, sort.direction, sortColumn.sortValue)
        : filtered;
    return { total: filtered.length, ...paginate(sorted, page, pageSize) };
  }, [rows, query, searchText, columns, sort, page, pageSize]);

  const hideClass = (column: DataTableColumn<T>) =>
    column.hideOnMobile ? 'hidden md:table-cell' : '';

  return (
    <div className="flex flex-col gap-3">
      {searchText || toolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {searchText ? (
            <SearchBar
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="sm:max-w-sm sm:flex-1"
            />
          ) : null}
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface-muted text-xs text-text-muted uppercase">
            <tr>
              {columns.map((column) => {
                const direction = sort?.columnId === column.id ? sort.direction : null;
                const SortIcon =
                  direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={
                      direction === 'asc'
                        ? 'ascending'
                        : direction === 'desc'
                          ? 'descending'
                          : undefined
                    }
                    className={cn(
                      'px-4 py-2 font-semibold',
                      column.align === 'right' && 'text-right',
                      hideClass(column),
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        aria-label={t('ui.table.sortBy', { column: column.header })}
                        onClick={() => {
                          setSort((current) => nextSort(current, column.id));
                        }}
                        className="inline-flex min-h-touch items-center gap-1 uppercase hover:text-text"
                      >
                        {column.header}
                        <SortIcon aria-hidden className="size-3.5" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} className="border-t border-border">
                    {columns.map((column) => (
                      <td key={column.id} className={cn('px-4 py-3', hideClass(column))}>
                        <Skeleton className="h-5" />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.rows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    className={cn(
                      'relative border-t border-border',
                      onRowClick && 'hover:bg-surface-muted',
                    )}
                  >
                    {columns.map((column, index) => (
                      <td
                        key={column.id}
                        className={cn(
                          'px-4 py-3 text-text',
                          column.align === 'right' && 'text-right tabular-nums',
                          hideClass(column),
                        )}
                      >
                        {index === 0 && onRowClick ? (
                          <button
                            type="button"
                            onClick={() => {
                              onRowClick(row);
                            }}
                            className="text-left font-medium after:absolute after:inset-0 after:content-['']"
                          >
                            {column.cell(row)}
                          </button>
                        ) : (
                          column.cell(row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && visible.total === 0 ? (
          query ? (
            <p className="p-8 text-center text-sm text-text-muted">{t('ui.table.noResults')}</p>
          ) : (
            emptyState
          )
        ) : null}
      </div>
      {visible.pageCount > 1 ? (
        <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
          <span>{t('ui.table.rows', { count: visible.total })}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={visible.page === 1}
              onClick={() => {
                setPage(visible.page - 1);
              }}
            >
              {t('ui.table.previous')}
            </Button>
            <span aria-live="polite">
              {t('ui.table.page', { page: visible.page, pages: visible.pageCount })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={visible.page === visible.pageCount}
              onClick={() => {
                setPage(visible.page + 1);
              }}
            >
              {t('ui.table.next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
