import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('acepta texto y marca aria-invalid', async () => {
    render(<Input aria-label="Nombre" invalid />);
    const input = screen.getByRole('textbox', { name: 'Nombre' });
    await userEvent.type(input, 'Café');
    expect(input).toHaveValue('Café');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
