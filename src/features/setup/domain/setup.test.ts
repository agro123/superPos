import { describe, expect, it } from 'vitest';
import {
  canFinish,
  firstPendingStep,
  markStep,
  needsSetup,
  setupProgress,
  shouldStartTour,
} from './setup';

const empty = { completedSteps: [], skippedSteps: [], dismissedAt: null, completedAt: null };

describe('asistente de configuración', () => {
  it('lleva el avance y retoma en el primer paso pendiente', () => {
    let state = markStep(empty, 'business', 'completed');
    state = markStep(state, 'modules', 'skipped');
    expect(setupProgress(state)).toEqual({ done: 2, total: 9, percent: 22 });
    expect(firstPendingStep(state)).toBe('categories');
    // Hacer un paso omitido lo pasa a hecho.
    state = markStep(state, 'modules', 'completed');
    expect(state).toMatchObject({ completedSteps: ['business', 'modules'], skippedSteps: [] });
  });

  it('solo el paso del negocio es obligatorio', () => {
    expect(canFinish(empty)).toBe(false);
    expect(canFinish(markStep(empty, 'business', 'completed'))).toBe(true);
  });

  it('redirige solo si está pendiente, no se pospuso y el usuario puede configurarlo', () => {
    expect(needsSetup(empty, true)).toBe(true);
    expect(needsSetup(empty, false)).toBe(false);
    expect(needsSetup(null, true)).toBe(false);
    expect(needsSetup({ ...empty, dismissedAt: new Date() }, true)).toBe(false);
    expect(needsSetup({ ...empty, completedAt: new Date() }, true)).toBe(false);
  });

  it('el tour arranca una vez, con el negocio configurado', () => {
    expect(shouldStartTour(empty, false)).toBe(false);
    expect(shouldStartTour({ ...empty, completedAt: new Date() }, false)).toBe(true);
    expect(shouldStartTour({ ...empty, completedAt: new Date() }, true)).toBe(false);
    expect(shouldStartTour(null, false)).toBe(true);
  });
});
