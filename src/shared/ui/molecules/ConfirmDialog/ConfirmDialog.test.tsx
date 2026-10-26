import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('confirma o cancela', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="¿Vaciar el carrito?"
        tone="danger"
        confirmLabel="Vaciar"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('alertdialog', { name: '¿Vaciar el carrito?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
