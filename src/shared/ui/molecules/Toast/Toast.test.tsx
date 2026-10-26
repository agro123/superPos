import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toaster } from './Toaster';

describe('Toaster', () => {
  it('muestra los mensajes y permite cerrarlos', async () => {
    const onDismiss = vi.fn();
    render(
      <Toaster
        toasts={[{ id: '1', title: 'Producto guardado', tone: 'success' }]}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText('Producto guardado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onDismiss).toHaveBeenCalledWith('1');
  });
});
