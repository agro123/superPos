import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'store', label: 'Tienda' },
  { value: 'cafe', label: 'Cafetería' },
];

describe('Select', () => {
  it('muestra el placeholder y permite elegir una opción', async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        aria-label="Tipo"
        options={options}
        onValueChange={onValueChange}
        placeholder="Elige"
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Tipo' });
    expect(trigger).toHaveTextContent('Elige');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Cafetería' }));
    expect(onValueChange).toHaveBeenCalledWith('cafe');
  });

  it('muestra la opción seleccionada', () => {
    render(<Select aria-label="Tipo" options={options} value="store" />);
    expect(screen.getByRole('combobox', { name: 'Tipo' })).toHaveTextContent('Tienda');
  });
});
