import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

function Harness({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <SearchBar
      value={value}
      onValueChange={setValue}
      onSubmit={onSubmit}
      label="Buscar productos"
      shortcut="F2"
    />
  );
}

describe('SearchBar', () => {
  it('escribe, envía con Enter y limpia', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const input = screen.getByRole('searchbox', { name: 'Buscar productos' });
    await userEvent.type(input, '7701234{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('7701234');
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(input).toHaveValue('');
  });

  it('Escape limpia el texto', async () => {
    render(<Harness onSubmit={vi.fn()} />);
    const input = screen.getByRole('searchbox');
    await userEvent.type(input, 'café{Escape}');
    expect(input).toHaveValue('');
  });
});
