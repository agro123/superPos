import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: string;
  name: string;
  stock: number;
}

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Nombre', cell: (r) => r.name, sortValue: (r) => r.name },
  { id: 'stock', header: 'Stock', cell: (r) => r.stock, sortValue: (r) => r.stock, align: 'right' },
];

const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: String(i),
  name: `Producto ${i + 1}`,
  stock: i,
}));

function renderTable(onRowClick = vi.fn()) {
  render(
    <DataTable
      caption="Productos"
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      searchText={(r) => r.name}
      onRowClick={onRowClick}
      pageSize={10}
      emptyState={<p>Vacío</p>}
    />,
  );
  return onRowClick;
}

describe('DataTable', () => {
  it('pagina los resultados', async () => {
    renderTable();
    const table = screen.getByRole('table', { name: 'Productos' });
    expect(within(table).getAllByRole('row')).toHaveLength(11);
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('ordena al pulsar el encabezado y lo anuncia con aria-sort', async () => {
    renderTable();
    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Stock' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ordenar por Stock' }));
    expect(screen.getByRole('columnheader', { name: /Stock/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Producto 25');
  });

  it('filtra con el buscador y abre el detalle con la primera celda', async () => {
    const onRowClick = renderTable();
    await userEvent.type(screen.getByRole('searchbox'), 'producto 7');
    expect(screen.getAllByRole('row')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Producto 7' }));
    expect(onRowClick).toHaveBeenCalledWith(rows[6]);
    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('No hay resultados')).toBeInTheDocument();
  });

  it('muestra skeletons en carga y el estado vacío sin filas', () => {
    const { rerender } = render(
      <DataTable caption="T" columns={columns} rows={[]} getRowId={(r) => r.id} loading />,
    );
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    rerender(
      <DataTable
        caption="T"
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        emptyState={<p>Vacío</p>}
      />,
    );
    expect(screen.getByText('Vacío')).toBeInTheDocument();
  });
});
