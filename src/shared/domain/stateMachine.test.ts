import { describe, expect, it } from 'vitest';
import { AppError } from './errors';
import { defineStateMachine } from './stateMachine';

const machine = defineStateMachine<'a' | 'b' | 'c'>('test', { a: ['b'], b: ['c', 'a'], c: [] });

describe('defineStateMachine', () => {
  it('permite solo las transiciones declaradas', () => {
    expect(machine.canTransition('a', 'b')).toBe(true);
    expect(machine.canTransition('a', 'c')).toBe(false);
    expect(machine.canTransition('c', 'a')).toBe(false);
  });

  it('assertTransition lanza AppError invalid_transition', () => {
    expect(() => {
      machine.assertTransition('b', 'c');
    }).not.toThrow();
    try {
      machine.assertTransition('a', 'c');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('invalid_transition');
    }
  });

  it('expone estados, siguientes y terminales', () => {
    expect(machine.states).toEqual(['a', 'b', 'c']);
    expect(machine.nextStates('b')).toEqual(['c', 'a']);
    expect(machine.isTerminal('c')).toBe(true);
    expect(machine.isTerminal('a')).toBe(false);
  });
});
