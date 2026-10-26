import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Numpad } from './Numpad';

function Harness() {
  const [value, setValue] = useState('');
  return (
    <>
      <Numpad value={value} onValueChange={setValue} />
      <output>{value}</output>
    </>
  );
}

describe('Numpad', () => {
  it('compone el número con los botones', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: '00' }));
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByRole('status')).toHaveTextContent('2005');
    await userEvent.click(screen.getByRole('button', { name: 'Borrar último dígito' }));
    expect(screen.getByRole('status')).toHaveTextContent('200');
  });
});
