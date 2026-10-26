import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('muestra título, descripción y acción', () => {
    render(
      <EmptyState
        title="Sin productos"
        description="Crea el primero"
        action={<button type="button">Crear</button>}
      />,
    );
    expect(screen.getByText('Sin productos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('en tono danger se anuncia como alerta', () => {
    render(<EmptyState title="Error" tone="danger" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error');
  });
});
