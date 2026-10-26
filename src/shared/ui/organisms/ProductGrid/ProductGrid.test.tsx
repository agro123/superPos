import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductGrid } from './ProductGrid';

describe('ProductGrid', () => {
  it('selecciona un producto con un toque y respeta los deshabilitados', async () => {
    const onSelect = vi.fn();
    render(
      <ProductGrid
        label="Productos"
        onSelect={onSelect}
        items={[
          { id: 'p1', name: 'Café americano', priceLabel: '$ 3.500' },
          {
            id: 'p2',
            name: 'Torta',
            priceLabel: '$ 6.000',
            disabled: true,
            badge: { label: 'Agotado', tone: 'danger' },
          },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Café americano/ }));
    expect(onSelect).toHaveBeenCalledWith('p1');
    expect(screen.getByRole('button', { name: /Torta/ })).toBeDisabled();
  });

  it('muestra el estado vacío y la carga', () => {
    const { rerender } = render(
      <ProductGrid label="P" items={[]} onSelect={vi.fn()} emptyState={<p>Sin productos</p>} />,
    );
    expect(screen.getByText('Sin productos')).toBeInTheDocument();
    rerender(<ProductGrid label="P" items={[]} onSelect={vi.fn()} loading />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(8);
  });
});
