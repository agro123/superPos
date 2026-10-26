import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CartPanel } from './CartPanel';

const baseProps = {
  totals: [{ label: 'Total', value: '$ 7.000', emphasis: true }],
  onQuantityChange: vi.fn(),
  onRemove: vi.fn(),
  onCheckout: vi.fn(),
  checkoutLabel: 'Cobrar $ 7.000',
};

describe('CartPanel', () => {
  it('cambia cantidades, quita líneas y cobra', async () => {
    const props = {
      ...baseProps,
      onQuantityChange: vi.fn(),
      onRemove: vi.fn(),
      onCheckout: vi.fn(),
    };
    render(
      <CartPanel
        {...props}
        lines={[
          { id: 'l1', name: 'Café', quantity: 2, unitPriceLabel: '$ 3.500', totalLabel: '$ 7.000' },
        ]}
      />,
    );
    expect(screen.getByText('2 artículos')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar Café' }));
    expect(props.onQuantityChange).toHaveBeenCalledWith('l1', 3);
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Café' }));
    expect(props.onRemove).toHaveBeenCalledWith('l1');
    await userEvent.click(screen.getByRole('button', { name: 'Cobrar $ 7.000' }));
    expect(props.onCheckout).toHaveBeenCalledOnce();
  });

  it('vacío: muestra el estado vacío y deshabilita el cobro', () => {
    render(<CartPanel {...baseProps} lines={[]} />);
    expect(screen.getByText('El carrito está vacío')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cobrar $ 7.000' })).toBeDisabled();
  });
});
