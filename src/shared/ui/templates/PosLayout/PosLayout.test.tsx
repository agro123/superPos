import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PosLayout } from './PosLayout';

describe('PosLayout', () => {
  it('muestra el catálogo y abre el carrito desde el botón inferior', async () => {
    const onCartOpenChange = vi.fn();
    render(
      <PosLayout
        catalog={<p>Catálogo</p>}
        cart={<p>Carrito</p>}
        cartSummary="2 artículos"
        cartOpen={false}
        onCartOpenChange={onCartOpenChange}
      />,
    );
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Ver carrito · 2 artículos/ }));
    expect(onCartOpenChange).toHaveBeenCalledWith(true);
  });
});
