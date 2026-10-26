import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuantityStepper } from './QuantityStepper';

describe('QuantityStepper', () => {
  it('aumenta y disminuye respetando los límites', async () => {
    const onValueChange = vi.fn();
    render(
      <QuantityStepper value={1} min={1} max={2} itemName="Café" onValueChange={onValueChange} />,
    );
    expect(screen.getByRole('button', { name: 'Disminuir Café' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar Café' }));
    expect(onValueChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole('group', { name: 'Cantidad: Café' })).toHaveTextContent('1');
  });
});
