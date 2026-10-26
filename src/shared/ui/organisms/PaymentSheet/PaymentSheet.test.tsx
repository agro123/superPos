import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PaymentSheet } from './PaymentSheet';

describe('PaymentSheet', () => {
  it('muestra total, permite elegir método y confirmar', async () => {
    const onMethodChange = vi.fn();
    const onConfirm = vi.fn();
    render(
      <PaymentSheet
        open
        onOpenChange={vi.fn()}
        totalLabel="$ 7.000"
        methods={[
          { value: 'cash', label: 'Efectivo', icon: null },
          { value: 'card', label: 'Tarjeta', icon: null },
        ]}
        method="cash"
        onMethodChange={onMethodChange}
        tenderedLabel="$ 10.000"
        summary={{ label: 'Cambio', value: '$ 3.000', tone: 'success' }}
        keypad={<div>teclado</div>}
        confirmLabel="Confirmar cobro"
        onConfirm={onConfirm}
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Cobrar' });
    expect(dialog).toHaveTextContent('$ 7.000');
    expect(dialog).toHaveTextContent('Cambio');
    await userEvent.click(screen.getByRole('radio', { name: 'Tarjeta' }));
    expect(onMethodChange).toHaveBeenCalledWith('card');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cobro' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
