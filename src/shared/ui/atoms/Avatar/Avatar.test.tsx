import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('muestra iniciales y el nombre para lectores de pantalla', () => {
    render(<Avatar name="Ana María Ríos" />);
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByText('Ana María Ríos')).toHaveClass('sr-only');
  });
});
