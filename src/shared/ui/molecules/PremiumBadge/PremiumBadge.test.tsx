import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PremiumBadge } from './PremiumBadge';

describe('PremiumBadge', () => {
  it('muestra el texto (no depende solo del color)', () => {
    render(<PremiumBadge label="Premium" />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });
});
