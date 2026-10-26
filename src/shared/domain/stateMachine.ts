import { AppError } from './errors';

/** Máquina de estados finita con transiciones explícitas (L8). */
export interface StateMachine<S extends string> {
  readonly states: readonly S[];
  /** `true` si la transición `from → to` está permitida. */
  canTransition(from: S, to: S): boolean;
  /** Lanza `AppError('invalid_transition')` si la transición no está permitida. */
  assertTransition(from: S, to: S): void;
  nextStates(from: S): readonly S[];
  /** Un estado terminal no tiene transiciones de salida. */
  isTerminal(state: S): boolean;
}

/**
 * Define una máquina de estados a partir de su tabla de transiciones.
 * @example defineStateMachine({ open: ['closed'], closed: [] })
 */
export function defineStateMachine<S extends string>(
  name: string,
  transitions: Readonly<Record<S, readonly S[]>>,
): StateMachine<S> {
  const states = Object.keys(transitions) as S[];
  const nextStates = (from: S): readonly S[] => transitions[from];
  const canTransition = (from: S, to: S): boolean => nextStates(from).includes(to);
  return {
    states,
    canTransition,
    nextStates,
    isTerminal: (state) => nextStates(state).length === 0,
    assertTransition(from, to) {
      if (!canTransition(from, to)) {
        throw new AppError('invalid_transition', `${name}: ${from} → ${to} no permitido`, {
          details: { machine: name, from, to },
        });
      }
    },
  };
}
