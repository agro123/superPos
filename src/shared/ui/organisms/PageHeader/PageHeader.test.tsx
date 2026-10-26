import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('muestra el título como h1, el enlace de regreso y las acciones', () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Productos"
          description="Tu catálogo"
          backTo={{ to: '/', label: 'Inicio' }}
          actions={<button type="button">Nuevo</button>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();
  });
});
