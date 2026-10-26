import { describe, expect, it } from 'vitest';
import { normalizeSearch } from '@/shared/lib/text';
import { filterRows, nextSort, paginate, sortRows } from './dataTableModel';

const rows = [
  { name: 'Café', price: 300 },
  { name: 'agua', price: 100 },
  { name: 'Bebida 10', price: 200 },
  { name: 'Bebida 2', price: 200 },
];

describe('dataTableModel', () => {
  it('busca sin distinguir tildes ni mayúsculas', () => {
    expect(normalizeSearch('  CAFÉ ')).toBe('cafe');
    expect(filterRows(rows, 'cafe', (r) => r.name)).toEqual([rows[0]]);
    expect(filterRows(rows, '', (r) => r.name)).toBe(rows);
  });

  it('ordena texto con orden natural y números', () => {
    expect(sortRows(rows, 'asc', (r) => r.name).map((r) => r.name)).toEqual([
      'agua',
      'Bebida 2',
      'Bebida 10',
      'Café',
    ]);
    expect(sortRows(rows, 'desc', (r) => r.price).map((r) => r.price)).toEqual([
      300, 200, 200, 100,
    ]);
  });

  it('cicla el orden asc → desc → ninguno', () => {
    expect(nextSort(null, 'name')).toEqual({ columnId: 'name', direction: 'asc' });
    expect(nextSort({ columnId: 'name', direction: 'asc' }, 'name')).toEqual({
      columnId: 'name',
      direction: 'desc',
    });
    expect(nextSort({ columnId: 'name', direction: 'desc' }, 'name')).toBeNull();
    expect(nextSort({ columnId: 'name', direction: 'desc' }, 'price')).toEqual({
      columnId: 'price',
      direction: 'asc',
    });
  });

  it('pagina y acota la página', () => {
    expect(paginate(rows, 2, 3)).toEqual({ rows: [rows[3]], page: 2, pageCount: 2 });
    expect(paginate(rows, 9, 3).page).toBe(2);
    expect(paginate([], 1, 10)).toEqual({ rows: [], page: 1, pageCount: 1 });
  });
});
