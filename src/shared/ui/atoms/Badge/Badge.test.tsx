import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('muestra el texto con el tono indicado', () => {
    render(<Badge tone="warning">Stock bajo</Badge>);
    expect(screen.getByText('Stock bajo')).toHaveClass('bg-warning-soft');
  });
});
