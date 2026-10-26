import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('marca el ítem activo', () => {
    render(
      <MemoryRouter initialEntries={['/sales']}>
        <BottomNav
          items={[
            { to: '/pos', label: 'Vender', icon: null },
            { to: '/sales', label: 'Ventas', icon: null },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Ventas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Vender' })).not.toHaveAttribute('aria-current');
  });
});
