import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('anuncia la carga con role status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
  });
});
