/**
 * Definitive playthrough tests for the b-in-middle PDA.
 * Simulates exactly what the Play button does: repeated STEP_FORWARD
 * with no transitionIndex (auto-advance on nondeterministic choices).
 * Verifies every predefined input terminates within a bounded number of steps.
 */
import { describe, it, expect } from 'vitest';
import { simulatorReducer } from '../context/SimulatorContext';
import { createInitialState } from './simulator';
import { bInMiddle } from '../data/bInMiddle';

const MAX_STEPS = 50;

function playThrough(input: string) {
  let state = createInitialState(bInMiddle, input);
  let steps = 0;

  while (
    state.status !== 'accepted' &&
    state.status !== 'rejected' &&
    state.status !== 'looping' &&
    steps < MAX_STEPS
  ) {
    if (state.status === 'branching') {
      // Pick the last branch (the "guess middle" one) to test the accepting path
      const lastBranch = state.branches[state.branches.length - 1];
      state = simulatorReducer(state, { type: 'SELECT_BRANCH', payload: lastBranch.id });
    } else {
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    }
    steps++;
  }

  return { state, steps };
}

describe('b-in-middle PDA: full playthrough (simulating Play button)', () => {
  for (const pi of bInMiddle.predefinedInputs) {
    it(`"${pi.value || 'ε'}" terminates within ${MAX_STEPS} steps`, () => {
      const { state, steps } = playThrough(pi.value);
      expect(steps).toBeLessThan(MAX_STEPS);
      expect(['accepted', 'rejected', 'looping']).toContain(state.status);
    });
  }

  it('"aba" accepts via the correct branch (guess middle at index 1)', () => {
    let state = createInitialState(bInMiddle, 'aba');
    // Step 1: read 'a' → deterministic, push S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    // Step 2: read 'b' → choose guess-middle branch (transitionIndex 1)
    state = simulatorReducer(state, { type: 'STEP_FORWARD', payload: { transitionIndex: 1 } });
    expect(state.currentState).toBe('q2');
    // Step 3: read 'a' → pop S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    // Step 4: read □ with $ → pop $ → accept
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.status).toBe('accepted');
  });

  it('"aabba" accepts via the correct branch (guess middle at index 2)', () => {
    let state = createInitialState(bInMiddle, 'aabba');
    // Step 1: read 'a' with $ → push S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    // Step 2: read 'a' with S → push S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    // Step 3: read 'b' with S → guess middle (transitionIndex 1)
    state = simulatorReducer(state, { type: 'STEP_FORWARD', payload: { transitionIndex: 1 } });
    expect(state.currentState).toBe('q2');
    expect(state.stack).toEqual(['$', 'S', 'S']); // kept S
    // Step 4: read 'b' with S → pop S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stack).toEqual(['$', 'S']);
    // Step 5: read 'a' with S → pop S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stack).toEqual(['$']);
    // Step 6: read □ with $ → pop $ → accept
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.status).toBe('accepted');
  });

  it('"b" accepts via the correct branch', () => {
    let state = createInitialState(bInMiddle, 'b');
    // Step 1: read 'b' with $ → guess middle (transitionIndex 1), keeps $
    state = simulatorReducer(state, { type: 'STEP_FORWARD', payload: { transitionIndex: 1 } });
    expect(state.currentState).toBe('q2');
    expect(state.stack).toEqual(['$']);
    // Step 2: read □ with $ → pop $ → accept
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.status).toBe('accepted');
  });
});
