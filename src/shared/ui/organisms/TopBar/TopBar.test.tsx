import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('muestra negocio, sincronización y menú de usuario', async () => {
    const onLogout = vi.fn();
    const onMenuClick = vi.fn();
    render(
      <TopBar
        businessName="Café La Esquina"
        user={{ name: 'Ana Ríos', email: 'ana@ejemplo.co' }}
        sync={{ state: 'offline', pendingCount: 2 }}
        onMenuClick={onMenuClick}
        userMenuItems={[{ id: 'logout', label: 'Cerrar sesión', onSelect: onLogout }]}
      />,
    );
    expect(screen.getByText('Café La Esquina')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión · 2');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }));
    expect(onMenuClick).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Menú de usuario: Ana Ríos' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
