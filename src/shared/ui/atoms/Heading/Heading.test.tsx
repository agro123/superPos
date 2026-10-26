import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Heading } from './Heading';

describe('Heading', () => {
  it('usa el nivel semántico indicado', () => {
    render(<Heading level={1}>Ventas</Heading>);
    expect(screen.getByRole('heading', { level: 1, name: 'Ventas' })).toBeInTheDocument();
  });
});
