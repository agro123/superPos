import { describe, expect, it } from 'vitest';
import { money } from '@/shared/domain/money';
import {
  addOrderLine,
  minutesSince,
  orderTotal,
  pendingLines,
  sendRound,
  setPendingQuantity,
} from './order';

const coffee = { id: 'p1', name: 'Tinto', priceMinor: money(200000), taxRateBps: 0 };
const soup = { id: 'p2', name: 'Sancocho', priceMinor: money(1800000), taxRateBps: 800 };

describe('comandas', () => {
  it('suma a la línea pendiente igual; con otra nota crea una línea nueva', () => {
    let lines = addOrderLine([], coffee, 'a');
    lines = addOrderLine(lines, coffee, 'b');
    lines = addOrderLine(lines, coffee, 'c', 'sin azúcar');
    expect(lines.map((l) => [l.id, l.quantity, l.notes])).toEqual([
      ['a', 2, null],
      ['c', 1, 'sin azúcar'],
    ]);
  });

  it('envía rondas: lo enviado queda fijo y lo nuevo es otra ronda', () => {
    const first = sendRound({ lines: addOrderLine([], soup, 'a'), round: 0 });
    expect(first?.round).toBe(1);
    expect(pendingLines(first?.lines ?? [])).toEqual([]);
    // Agregar el mismo producto después crea una línea pendiente nueva.
    const more = addOrderLine(first?.lines ?? [], soup, 'b');
    expect(more.map((l) => [l.id, l.round])).toEqual([
      ['a', 1],
      ['b', 0],
    ]);
    // Lo enviado no se modifica ni se borra.
    expect(setPendingQuantity(more, 'a', 0).map((l) => l.id)).toEqual(['a', 'b']);
    expect(setPendingQuantity(more, 'b', 0).map((l) => l.id)).toEqual(['a']);
    expect(sendRound({ lines: setPendingQuantity(more, 'b', 0), round: 1 })).toBeNull();
    expect(sendRound({ lines: more, round: 1 })?.round).toBe(2);
  });

  it('total y minutos', () => {
    expect(orderTotal(addOrderLine(addOrderLine([], coffee, 'a'), soup, 'b'))).toBe(2000000);
    expect(minutesSince(new Date('2026-11-09T12:00:00Z'), new Date('2026-11-09T12:17:30Z'))).toBe(
      17,
    );
  });
});
