import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('se anuncia como separador cuando no es decorativo', () => {
    render(<Divider decorative={false} />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
