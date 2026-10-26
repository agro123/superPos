import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { X } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('expone el label como nombre accesible', async () => {
    const onClick = vi.fn();
    render(<IconButton label="Cerrar" icon={<X />} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
