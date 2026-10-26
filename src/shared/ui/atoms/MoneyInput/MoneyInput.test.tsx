import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { Money } from '@/shared/domain/money';
import { MoneyInput } from './MoneyInput';

function Harness() {
  const [value, setValue] = useState<Money | null>(null);
  return (
    <>
      <MoneyInput aria-label="Precio" currency="COP" value={value} onValueChange={setValue} />
      <output>{value ?? 'vacío'}</output>
    </>
  );
}

describe('MoneyInput', () => {
  it('emite centavos a partir de pesos escritos con separadores', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Precio' }), '12.500');
    expect(screen.getByRole('status')).toHaveTextContent('1250000');
  });

  it('emite null con texto inválido', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Precio' }), 'abc');
    expect(screen.getByRole('status')).toHaveTextContent('vacío');
  });
});
