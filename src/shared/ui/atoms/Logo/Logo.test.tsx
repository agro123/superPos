import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('muestra el nombre del producto, también en modo compacto para lectores de pantalla', () => {
    const { rerender } = render(<Logo />);
    expect(screen.getByText('SuperPOS')).toBeVisible();
    rerender(<Logo compact />);
    expect(screen.getByText('SuperPOS')).toHaveClass('sr-only');
  });
});
