import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('cambia de estado con clic y con teclado', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Módulo restaurante" onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('switch', { name: 'Módulo restaurante' });
    await userEvent.click(control);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    control.focus();
    await userEvent.keyboard(' ');
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });
});
