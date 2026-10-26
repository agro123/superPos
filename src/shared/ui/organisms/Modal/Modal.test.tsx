import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('muestra título y contenido, y se cierra', async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        title="Abrir caja"
        description="Cuenta el efectivo inicial"
        footer={<button type="button">Abrir</button>}
      >
        <p>Formulario</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Abrir caja' });
    expect(dialog).toHaveAccessibleDescription('Cuenta el efectivo inicial');
    expect(dialog).toHaveTextContent('Formulario');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
