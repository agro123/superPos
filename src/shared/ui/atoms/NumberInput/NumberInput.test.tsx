import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { NumberInput } from './NumberInput';

function Harness({ allowDecimal = false }: { allowDecimal?: boolean }) {
  const [value, setValue] = useState<number | null>(null);
  return (
    <>
      <NumberInput
        aria-label="Stock"
        value={value}
        onValueChange={setValue}
        min={0}
        max={10}
        allowDecimal={allowDecimal}
      />
      <output>{value ?? 'vacío'}</output>
    </>
  );
}

describe('NumberInput', () => {
  it('convierte el texto a número y aplica el máximo al salir', async () => {
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Stock' });
    await userEvent.type(input, '25');
    expect(screen.getByRole('status')).toHaveTextContent('25');
    await userEvent.tab();
    expect(screen.getByRole('status')).toHaveTextContent('10');
    expect(input).toHaveValue('10');
  });

  it('acepta coma decimal sin perder lo que se está escribiendo', async () => {
    render(<Harness allowDecimal />);
    const input = screen.getByRole('textbox', { name: 'Stock' });
    await userEvent.type(input, '1,5');
    expect(input).toHaveValue('1,5');
    expect(screen.getByRole('status')).toHaveTextContent('1.5');
  });

  it('texto inválido produce null', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Stock' }), 'x');
    expect(screen.getByRole('status')).toHaveTextContent('vacío');
  });
});
