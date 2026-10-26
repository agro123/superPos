import { normalizeSearch } from '@/shared/lib/text';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

export function filterRows<T>(
  rows: readonly T[],
  query: string,
  getText: (row: T) => string,
): readonly T[] {
  const needle = normalizeSearch(query);
  if (!needle) return rows;
  return rows.filter((row) => normalizeSearch(getText(row)).includes(needle));
}

export function sortRows<T>(
  rows: readonly T[],
  direction: SortDirection,
  getValue: (row: T) => string | number,
): readonly T[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = getValue(a);
    const right = getValue(b);
    const comparison =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : collator.compare(String(left), String(right));
    return comparison * factor;
  });
}

/** Siguiente estado de orden al pulsar una columna: asc → desc → sin orden. */
export function nextSort(current: SortState | null, columnId: string): SortState | null {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  return current.direction === 'asc' ? { columnId, direction: 'desc' } : null;
}

export interface Page<T> {
  rows: readonly T[];
  page: number;
  pageCount: number;
}

/** Página 1-based, acotada al rango válido. */
export function paginate<T>(rows: readonly T[], page: number, pageSize: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), page: current, pageCount };
}
