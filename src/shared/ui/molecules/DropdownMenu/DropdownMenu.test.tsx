import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropdownMenu } from './DropdownMenu';

describe('DropdownMenu', () => {
  it('abre el menú y ejecuta la acción elegida', async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu
        trigger={<button type="button">Cuenta</button>}
        heading="ana@ejemplo.co"
        items={[{ id: 'logout', label: 'Cerrar sesión', onSelect, tone: 'danger' }]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cuenta' }));
    expect(screen.getByText('ana@ejemplo.co')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
