import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('muestra etiqueta, valor y tendencia', () => {
    render(
      <StatCard
        label="Ventas de hoy"
        value="$ 120.000"
        trend={{ label: '+5 %', tone: 'success' }}
      />,
    );
    const card = screen.getByRole('region', { name: 'Ventas de hoy' });
    expect(card).toHaveTextContent('$ 120.000');
    expect(card).toHaveTextContent('+5 %');
  });

  it('en carga muestra un skeleton en lugar del valor', () => {
    render(<StatCard label="Ventas" value="$ 1" loading />);
    expect(screen.queryByText('$ 1')).not.toBeInTheDocument();
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
