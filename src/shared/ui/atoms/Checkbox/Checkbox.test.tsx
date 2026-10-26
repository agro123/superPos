import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('emite booleanos al marcar y desmarcar', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Controla stock" onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Controla stock' });
    await userEvent.click(checkbox);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });
});
