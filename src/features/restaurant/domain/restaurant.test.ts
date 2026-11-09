import { describe, expect, it } from 'vitest';
import { orderStatusMachine, tableStatusMachine } from './restaurant';

describe('máquinas de estado del restaurante (L8)', () => {
  it('una comanda servida no se puede cancelar', () => {
    expect(orderStatusMachine.canTransition('sent', 'served')).toBe(true);
    expect(orderStatusMachine.canTransition('served', 'cancelled')).toBe(false);
    // Otra ronda después de servir y cobro en cualquier estado activo.
    expect(orderStatusMachine.canTransition('served', 'sent')).toBe(true);
    expect(orderStatusMachine.canTransition('open', 'paid')).toBe(true);
    expect(orderStatusMachine.isTerminal('paid')).toBe(true);
  });

  it('una mesa ocupada solo puede liberarse', () => {
    expect(tableStatusMachine.nextStates('occupied')).toEqual(['free']);
    expect(tableStatusMachine.canTransition('free', 'reserved')).toBe(true);
  });
});
