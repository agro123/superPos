import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('muestra el contenido y se cierra con Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer open onOpenChange={onOpenChange} title="Venta A1-000123">
        <p>Detalle</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Venta A1-000123' })).toHaveTextContent('Detalle');
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
