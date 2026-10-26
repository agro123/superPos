import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AppSidebar } from './AppSidebar';

describe('AppSidebar', () => {
  it('marca la ruta activa y notifica la navegación', async () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter initialEntries={['/pos']}>
        <AppSidebar
          brand="Tienda Doña Rosa"
          onNavigate={onNavigate}
          sections={[
            {
              id: 'main',
              items: [
                { to: '/', label: 'Inicio', icon: null, end: true },
                { to: '/pos', label: 'Vender', icon: null },
              ],
            },
          ]}
        />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vender' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('link', { name: 'Inicio' }));
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
