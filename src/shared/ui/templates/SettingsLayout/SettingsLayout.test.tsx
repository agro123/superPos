import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SettingsLayout } from './SettingsLayout';

describe('SettingsLayout', () => {
  it('marca la sección activa', () => {
    render(
      <MemoryRouter initialEntries={['/settings/taxes']}>
        <SettingsLayout
          header={<h1>Configuración</h1>}
          items={[
            { to: '/settings/business', label: 'Negocio', icon: null },
            { to: '/settings/taxes', label: 'Impuestos', icon: null },
          ]}
        >
          <p>Contenido</p>
        </SettingsLayout>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('navigation', { name: 'Secciones de configuración' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Impuestos' })).toHaveAttribute('aria-current', 'page');
  });
});
