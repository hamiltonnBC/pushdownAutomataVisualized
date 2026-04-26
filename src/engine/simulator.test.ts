import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  getApplicableTransitions,
  applyTransition,
  isTerminal,
  isAccepted,
  validateInput,
  detectLoop,
  generateAnnotation,
} from './simulator';
import { nestedParentheses } from '../data/nestedParentheses';
import { zeroNOneN } from '../data/zeroNOneN';
import { bInMiddle } from '../data/bInMiddle';
import type { SimulatorState, Transition } from '../types';

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------
describe('createInitialState', () => {
  it('sets tape to input chars followed by blank □', () => {
    const state = createInitialState(nestedParentheses, 'aabb');
    expect(state.tape).toEqual(['a', 'a', 'b', 'b', '□']);
  });

  it('handles empty input string', () => {
    const state = createInitialState(zeroNOneN, '');
    expect(state.tape).toEqual(['□']);
  });

  it('sets headPosition to 0', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    expect(state.headPosition).toBe(0);
  });

  it('initialises stack with just $', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    expect(state.stack).toEqual(['$']);
  });

  it('sets currentState to the PDA startState', () => {
    const state = createInitialState(zeroNOneN, '01');
    expect(state.currentState).toBe('q0');
  });

  it('sets status to ready', () => {
    const state = createInitialState(nestedParentheses, 'a');
    expect(state.status).toBe('ready');
  });

  it('starts with empty history and step 0', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    expect(state.history).toEqual([]);
    expect(state.currentStep).toBe(0);
  });

  it('stores the definition and input string', () => {
    const state = createInitialState(bInMiddle, 'aba');
    expect(state.pdaDefinition).toBe(bInMiddle);
    expect(state.inputString).toBe('aba');
  });

  it('initialises branch fields to defaults', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    expect(state.branches).toEqual([]);
    expect(state.activeBranchId).toBeNull();
    expect(state.lastAppliedTransition).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getApplicableTransitions
// ---------------------------------------------------------------------------
describe('getApplicableTransitions', () => {
  it('returns matching transitions for a deterministic PDA', () => {
    const result = getApplicableTransitions(nestedParentheses, 'q', 'a', '$');
    expect(result).toHaveLength(1);
    expect(result[0].stackReplacement).toEqual(['$', 'S']);
  });

  it('returns empty array when no transition matches', () => {
    const result = getApplicableTransitions(nestedParentheses, 'q', 'x', '$');
    expect(result).toEqual([]);
  });

  it('returns multiple transitions for a nondeterministic PDA', () => {
    // Reading 'b' with 'S' on top in state q of bInMiddle has two options:
    // stay in q (push S) or jump to q2 (pop S)
    const result = getApplicableTransitions(bInMiddle, 'q', 'b', 'S');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('matches on all three criteria (state, tapeSymbol, stackTop)', () => {
    const result = getApplicableTransitions(zeroNOneN, 'q1', '1', 'S');
    expect(result).toHaveLength(1);
    expect(result[0].toState).toBe('q1');
    expect(result[0].stackReplacement).toEqual([]);
  });

  it('distinguishes different stack tops', () => {
    const withDollar = getApplicableTransitions(zeroNOneN, 'q0', '0', '$');
    const withS = getApplicableTransitions(zeroNOneN, 'q0', '0', 'S');
    expect(withDollar).toHaveLength(1);
    expect(withS).toHaveLength(1);
    expect(withDollar[0].stackReplacement).toEqual(['$', 'S']);
    expect(withS[0].stackReplacement).toEqual(['S', 'S']);
  });
});

// ---------------------------------------------------------------------------
// applyTransition
// ---------------------------------------------------------------------------
describe('applyTransition', () => {
  const pushTransition: Transition = {
    fromState: 'q',
    tapeSymbol: 'a',
    stackTop: '$',
    toState: 'q',
    headDirection: 'R',
    stackReplacement: ['$', 'S'],
    explanation: 'push S',
  };

  const popTransition: Transition = {
    fromState: 'q',
    tapeSymbol: 'b',
    stackTop: 'S',
    toState: 'q',
    headDirection: 'R',
    stackReplacement: [],
    explanation: 'pop S',
  };

  function makeState(overrides: Partial<SimulatorState> = {}): SimulatorState {
    return {
      pdaDefinition: nestedParentheses,
      inputString: 'aabb',
      tape: ['a', 'a', 'b', 'b', '□'],
      headPosition: 0,
      stack: ['$'],
      currentState: 'q',
      status: 'ready',
      history: [],
      currentStep: 0,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
      ...overrides,
    };
  }

  it('replaces stack top correctly on push (replacement has symbols)', () => {
    const state = makeState();
    const next = applyTransition(state, pushTransition);
    // '$' is popped, then ['$', 'S'] pushed → stack = ['$', 'S']
    expect(next.stack).toEqual(['$', 'S']);
  });

  it('pops stack top when replacement is empty', () => {
    const state = makeState({ stack: ['$', 'S'], headPosition: 2 });
    const next = applyTransition(state, popTransition);
    // 'S' is popped, replacement is [] → stack = ['$']
    expect(next.stack).toEqual(['$']);
  });

  it('moves head right on R direction', () => {
    const state = makeState({ headPosition: 1 });
    const next = applyTransition(state, pushTransition);
    expect(next.headPosition).toBe(2);
  });

  it('keeps head position on N direction', () => {
    const nTransition: Transition = {
      ...pushTransition,
      headDirection: 'N',
    };
    const state = makeState({ headPosition: 3 });
    const next = applyTransition(state, nTransition);
    expect(next.headPosition).toBe(3);
  });

  it('changes currentState to transition toState', () => {
    const stateChangeTransition: Transition = {
      ...pushTransition,
      toState: 'q1',
    };
    const state = makeState();
    const next = applyTransition(state, stateChangeTransition);
    expect(next.currentState).toBe('q1');
  });

  it('sets status to running', () => {
    const state = makeState();
    const next = applyTransition(state, pushTransition);
    expect(next.status).toBe('running');
  });

  it('increments currentStep', () => {
    const state = makeState({ currentStep: 2 });
    const next = applyTransition(state, pushTransition);
    expect(next.currentStep).toBe(3);
  });

  it('records a snapshot in history', () => {
    const state = makeState();
    const next = applyTransition(state, pushTransition);
    expect(next.history).toHaveLength(1);
    const snap = next.history[0];
    expect(snap.step).toBe(1);
    expect(snap.headPosition).toBe(1);
    expect(snap.stack).toEqual(['$', 'S']);
    expect(snap.currentState).toBe('q');
    expect(snap.appliedTransition).toBe(pushTransition);
  });

  it('sets lastAppliedTransition', () => {
    const state = makeState();
    const next = applyTransition(state, pushTransition);
    expect(next.lastAppliedTransition).toBe(pushTransition);
  });

  it('preserves history from previous steps', () => {
    const state = makeState();
    const after1 = applyTransition(state, pushTransition);
    const after2 = applyTransition(after1, {
      ...pushTransition,
      stackTop: 'S',
      stackReplacement: ['S', 'S'],
    });
    expect(after2.history).toHaveLength(2);
    expect(after2.currentStep).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// isTerminal
// ---------------------------------------------------------------------------
describe('isTerminal', () => {
  it('returns true when stack is empty', () => {
    const state = createInitialState(nestedParentheses, '');
    // Manually empty the stack to simulate terminal
    const terminal: SimulatorState = { ...state, stack: [] };
    expect(isTerminal(terminal)).toBe(true);
  });

  it('returns false when stack has elements', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    expect(isTerminal(state)).toBe(false);
  });

  it('returns false when stack has only $', () => {
    const state = createInitialState(nestedParentheses, '');
    expect(isTerminal(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAccepted
// ---------------------------------------------------------------------------
describe('isAccepted', () => {
  it('returns true when stack empty and head on blank after last symbol', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    const accepted: SimulatorState = {
      ...state,
      stack: [],
      headPosition: 2, // inputString.length === 2
    };
    expect(isAccepted(accepted)).toBe(true);
  });

  it('returns false when stack is empty but head not at end', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    const notAccepted: SimulatorState = {
      ...state,
      stack: [],
      headPosition: 1,
    };
    expect(isAccepted(notAccepted)).toBe(false);
  });

  it('returns false when head at end but stack not empty', () => {
    const state = createInitialState(nestedParentheses, 'ab');
    const notAccepted: SimulatorState = {
      ...state,
      stack: ['$'],
      headPosition: 2,
    };
    expect(isAccepted(notAccepted)).toBe(false);
  });

  it('accepts empty input when stack is empty and head at 0', () => {
    const state = createInitialState(nestedParentheses, '');
    const accepted: SimulatorState = {
      ...state,
      stack: [],
      headPosition: 0, // inputString.length === 0
    };
    expect(isAccepted(accepted)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration: step through a short simulation
// ---------------------------------------------------------------------------
describe('integration: nested parentheses "ab"', () => {
  it('simulates accept for "ab" (one matched pair)', () => {
    let state = createInitialState(nestedParentheses, 'ab');

    // Step 1: read 'a' with '$' on top → push S
    let transitions = getApplicableTransitions(
      nestedParentheses,
      state.currentState,
      state.tape[state.headPosition],
      state.stack[state.stack.length - 1],
    );
    expect(transitions).toHaveLength(1);
    state = applyTransition(state, transitions[0]);
    expect(state.stack).toEqual(['$', 'S']);
    expect(state.headPosition).toBe(1);

    // Step 2: read 'b' with 'S' on top → pop S
    transitions = getApplicableTransitions(
      nestedParentheses,
      state.currentState,
      state.tape[state.headPosition],
      state.stack[state.stack.length - 1],
    );
    expect(transitions).toHaveLength(1);
    state = applyTransition(state, transitions[0]);
    expect(state.stack).toEqual(['$']);
    expect(state.headPosition).toBe(2);

    // Step 3: read '□' with '$' on top → pop $ (accept)
    transitions = getApplicableTransitions(
      nestedParentheses,
      state.currentState,
      state.tape[state.headPosition],
      state.stack[state.stack.length - 1],
    );
    expect(transitions).toHaveLength(1);
    state = applyTransition(state, transitions[0]);
    expect(isTerminal(state)).toBe(true);
    expect(isAccepted(state)).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// validateInput
// ---------------------------------------------------------------------------
describe('validateInput', () => {
  it('returns valid for empty string', () => {
    const result = validateInput('', ['a', 'b']);
    expect(result).toEqual({ valid: true, invalidSymbols: [] });
  });

  it('returns valid when all characters are in the alphabet', () => {
    const result = validateInput('aabb', ['a', 'b']);
    expect(result).toEqual({ valid: true, invalidSymbols: [] });
  });

  it('returns invalid with the offending symbols', () => {
    const result = validateInput('abc', ['a', 'b']);
    expect(result.valid).toBe(false);
    expect(result.invalidSymbols).toEqual(['c']);
  });

  it('returns unique invalid symbols only', () => {
    const result = validateInput('xyzxyz', ['a']);
    expect(result.valid).toBe(false);
    expect(result.invalidSymbols.sort()).toEqual(['x', 'y', 'z']);
  });

  it('works with the nestedParentheses alphabet', () => {
    expect(validateInput('aabb', nestedParentheses.tapeAlphabet).valid).toBe(true);
    const bad = validateInput('a0b', nestedParentheses.tapeAlphabet);
    expect(bad.valid).toBe(false);
    expect(bad.invalidSymbols).toEqual(['0']);
  });

  it('works with the zeroNOneN alphabet', () => {
    expect(validateInput('0011', zeroNOneN.tapeAlphabet).valid).toBe(true);
    const bad = validateInput('01ab', zeroNOneN.tapeAlphabet);
    expect(bad.valid).toBe(false);
    expect(bad.invalidSymbols.sort()).toEqual(['a', 'b']);
  });

  it('returns valid for empty alphabet with empty string', () => {
    expect(validateInput('', [])).toEqual({ valid: true, invalidSymbols: [] });
  });

  it('returns invalid for any character when alphabet is empty', () => {
    const result = validateInput('a', []);
    expect(result).toEqual({ valid: false, invalidSymbols: ['a'] });
  });
});


// ---------------------------------------------------------------------------
// detectLoop
// ---------------------------------------------------------------------------
describe('detectLoop', () => {
  function makeState(overrides: Partial<SimulatorState> = {}): SimulatorState {
    return {
      pdaDefinition: nestedParentheses,
      inputString: 'aab',
      tape: ['a', 'a', 'b', '□'],
      headPosition: 0,
      stack: ['$'],
      currentState: 'q',
      status: 'running',
      history: [],
      currentStep: 0,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
      ...overrides,
    };
  }

  it('returns false when history is empty', () => {
    const state = makeState();
    expect(detectLoop(state)).toBe(false);
  });

  it('returns true when current config matches a previous snapshot exactly', () => {
    const state = makeState({
      currentState: 'q',
      headPosition: 3,
      stack: ['$', 'S'],
      history: [
        {
          step: 1,
          headPosition: 3,
          stack: ['$', 'S'],
          currentState: 'q',
          appliedTransition: null,
          annotation: '',
        },
        {
          step: 2,
          headPosition: 3,
          stack: ['$', 'S'],
          currentState: 'q',
          appliedTransition: null,
          annotation: '',
        },
      ],
    });
    expect(detectLoop(state)).toBe(true);
  });

  it('returns false when state differs from all snapshots', () => {
    const state = makeState({
      currentState: 'q1',
      headPosition: 2,
      stack: ['$', 'S'],
      history: [
        {
          step: 1,
          headPosition: 2,
          stack: ['$', 'S'],
          currentState: 'q',
          appliedTransition: null,
          annotation: '',
        },
      ],
    });
    expect(detectLoop(state)).toBe(false);
  });

  it('returns false when head position differs from all snapshots', () => {
    const state = makeState({
      currentState: 'q',
      headPosition: 3,
      stack: ['$', 'S'],
      history: [
        {
          step: 1,
          headPosition: 2,
          stack: ['$', 'S'],
          currentState: 'q',
          appliedTransition: null,
          annotation: '',
        },
      ],
    });
    expect(detectLoop(state)).toBe(false);
  });

  it('returns false when stack differs from all snapshots', () => {
    const state = makeState({
      currentState: 'q',
      headPosition: 2,
      stack: ['$', 'S', 'S'],
      history: [
        {
          step: 1,
          headPosition: 2,
          stack: ['$', 'S'],
          currentState: 'q',
          appliedTransition: null,
          annotation: '',
        },
      ],
    });
    expect(detectLoop(state)).toBe(false);
  });

  it('detects loop in a stuck N-direction configuration via simulation', () => {
    // Simulate the nested parentheses PDA on "aab" (unmatched '(')
    // At end-of-input with S on stack, the transition is head=N, stack unchanged → loop
    let state = createInitialState(nestedParentheses, 'aab');

    // Step through: read 'a' (push S), read 'a' (push S), read 'b' (pop S)
    const step = () => {
      const top = state.stack[state.stack.length - 1];
      const sym = state.tape[state.headPosition];
      const ts = getApplicableTransitions(nestedParentheses, state.currentState, sym, top);
      expect(ts.length).toBeGreaterThan(0);
      state = applyTransition(state, ts[0]);
    };

    step(); // read 'a', stack: [$, S]
    step(); // read 'a', stack: [$, S, S]
    step(); // read 'b', stack: [$, S]

    // Now at '□' with S on top → transition keeps head=N, stack=['S'] (unchanged)
    step(); // read '□' with S on top → stays at same position, stack unchanged

    // The configuration after step 4 should match step 3's snapshot
    // because head didn't move and stack didn't change
    expect(detectLoop(state)).toBe(true);
  });

  it('does not false-positive during normal forward progress', () => {
    // Simulate "ab" on nested parentheses — should accept, no loop
    let state = createInitialState(nestedParentheses, 'ab');

    const step = () => {
      const top = state.stack[state.stack.length - 1];
      const sym = state.tape[state.headPosition];
      const ts = getApplicableTransitions(nestedParentheses, state.currentState, sym, top);
      expect(ts.length).toBeGreaterThan(0);
      state = applyTransition(state, ts[0]);
    };

    step(); // read 'a', push S
    expect(detectLoop(state)).toBe(false);

    step(); // read 'b', pop S
    expect(detectLoop(state)).toBe(false);

    step(); // read '□' with $ → pop $ (accept)
    expect(detectLoop(state)).toBe(false);
  });

  it('detects loop in 0^n1^n PDA on invalid input "10"', () => {
    // Input "10": first symbol is '1' with $ on top → head=N, stack unchanged → loop
    let state = createInitialState(zeroNOneN, '10');

    const top = state.stack[state.stack.length - 1];
    const sym = state.tape[state.headPosition];
    const ts = getApplicableTransitions(zeroNOneN, state.currentState, sym, top);
    expect(ts.length).toBeGreaterThan(0);
    state = applyTransition(state, ts[0]);

    // After one step, head=N and stack=[$] — same as initial config recorded in snapshot
    // But initial config is NOT in history (history only has post-transition snapshots).
    // We need a second step to see the repeat.
    const top2 = state.stack[state.stack.length - 1];
    const sym2 = state.tape[state.headPosition];
    const ts2 = getApplicableTransitions(zeroNOneN, state.currentState, sym2, top2);
    expect(ts2.length).toBeGreaterThan(0);
    state = applyTransition(state, ts2[0]);

    // Now step 2's config matches step 1's snapshot → loop detected
    expect(detectLoop(state)).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// generateAnnotation
// ---------------------------------------------------------------------------
describe('generateAnnotation', () => {
  // --- Start configuration (Req 10.2) ---
  it('describes initial setup when transition is null and status is ready', () => {
    const state = createInitialState(nestedParentheses, 'aabb');
    const annotation = generateAnnotation(state, null);
    expect(annotation).toContain('Start configuration');
    expect(annotation).toContain(nestedParentheses.startState);
    expect(annotation).toContain('aabb');
    expect(annotation).toContain('$');
  });

  it('describes empty input as ε in start configuration', () => {
    const state = createInitialState(zeroNOneN, '');
    const annotation = generateAnnotation(state, null);
    expect(annotation).toContain('Start configuration');
    expect(annotation).toContain('ε');
  });

  // --- Mid-computation with transition (Req 10.1, 10.4) ---
  it('references formal notation raA → r\'ℓw for a push transition', () => {
    const state = createInitialState(nestedParentheses, 'aabb');
    // Apply first transition: read 'a' with $ on top → push S
    const transitions = getApplicableTransitions(
      nestedParentheses, state.currentState, state.tape[0], state.stack[state.stack.length - 1],
    );
    const next = applyTransition(state, transitions[0]);
    const annotation = generateAnnotation(next, transitions[0]);

    // Should contain formal notation
    expect(annotation).toContain('Applying transition');
    expect(annotation).toContain('→');
    // Should describe what was read
    expect(annotation).toContain("reading 'a'");
    // Should describe stack operation
    expect(annotation).toContain('$');
    expect(annotation).toContain('push');
  });

  it('describes pop operation when stackReplacement is empty', () => {
    // Set up a state where we pop S (reading 'b' with S on top)
    let state = createInitialState(nestedParentheses, 'ab');
    // Step 1: push S
    const t1 = getApplicableTransitions(
      nestedParentheses, state.currentState, state.tape[0], state.stack[state.stack.length - 1],
    );
    state = applyTransition(state, t1[0]);
    // Step 2: pop S (read 'b' with S on top)
    const t2 = getApplicableTransitions(
      nestedParentheses, state.currentState, state.tape[state.headPosition], state.stack[state.stack.length - 1],
    );
    const next = applyTransition(state, t2[0]);
    const annotation = generateAnnotation(next, t2[0]);

    expect(annotation).toContain('pop S');
    expect(annotation).toContain('Applying transition');
  });

  it('describes keep operation when replacement equals stack top', () => {
    // The zeroNOneN PDA has transitions that keep $ on stack (e.g., q0, '1', '$' → q0, N, $)
    const keepTransition: Transition = {
      fromState: 'q0',
      tapeSymbol: '1',
      stackTop: '$',
      toState: 'q0',
      headDirection: 'N',
      stackReplacement: ['$'],
      explanation: 'loop',
    };
    const state: SimulatorState = {
      pdaDefinition: zeroNOneN,
      inputString: '10',
      tape: ['1', '0', '□'],
      headPosition: 0,
      stack: ['$'],
      currentState: 'q0',
      status: 'running',
      history: [],
      currentStep: 1,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: keepTransition,
    };
    const annotation = generateAnnotation(state, keepTransition);
    expect(annotation).toContain('keep $ on stack');
  });

  it('describes reading blank □ symbol', () => {
    // Simulate to end of input on "ab" for nested parentheses
    let state = createInitialState(nestedParentheses, 'ab');
    // Step through to blank
    const step = () => {
      const top = state.stack[state.stack.length - 1];
      const sym = state.tape[state.headPosition];
      const ts = getApplicableTransitions(nestedParentheses, state.currentState, sym, top);
      state = applyTransition(state, ts[0]);
      return ts[0];
    };
    step(); // read 'a'
    step(); // read 'b'
    const t3 = step(); // read '□'

    const annotation = generateAnnotation(state, t3);
    expect(annotation).toContain('blank □');
  });

  // --- Terminal: accepted (Req 10.3) ---
  it('explains acceptance when stack is empty and head past last symbol', () => {
    // Simulate "ab" on nested parentheses to acceptance
    let state = createInitialState(nestedParentheses, 'ab');
    let lastTransition: Transition | null = null;
    const step = () => {
      const top = state.stack[state.stack.length - 1];
      const sym = state.tape[state.headPosition];
      const ts = getApplicableTransitions(nestedParentheses, state.currentState, sym, top);
      lastTransition = ts[0];
      state = applyTransition(state, ts[0]);
    };
    step(); // read 'a', push S
    step(); // read 'b', pop S
    step(); // read '□', pop $ → accepted

    expect(isAccepted(state)).toBe(true);
    const annotation = generateAnnotation(state, lastTransition);
    expect(annotation).toContain('Accepted');
    expect(annotation).toContain('stack is empty');
    expect(annotation).toContain('head is past the last input symbol');
  });

  // --- Terminal: rejected (Req 10.3) ---
  it('explains rejection when stack empty but head not at end', () => {
    // Craft a state where stack is empty but head is not at end
    const rejectedState: SimulatorState = {
      pdaDefinition: nestedParentheses,
      inputString: 'aabb',
      tape: ['a', 'a', 'b', 'b', '□'],
      headPosition: 1,
      stack: [],
      currentState: 'q',
      status: 'running',
      history: [],
      currentStep: 2,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
    };
    const transition: Transition = {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: '$',
      toState: 'q',
      headDirection: 'N',
      stackReplacement: [],
      explanation: 'pop $',
    };
    const annotation = generateAnnotation(rejectedState, transition);
    expect(annotation).toContain('Rejected');
    expect(annotation).toContain('head has not reached the end');
  });

  it('explains rejection due to looping', () => {
    const loopingState: SimulatorState = {
      pdaDefinition: nestedParentheses,
      inputString: 'aab',
      tape: ['a', 'a', 'b', '□'],
      headPosition: 3,
      stack: ['$', 'S'],
      currentState: 'q',
      status: 'looping',
      history: [],
      currentStep: 4,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
    };
    const transition: Transition = {
      fromState: 'q',
      tapeSymbol: '□',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'N',
      stackReplacement: ['S'],
      explanation: 'loop',
    };
    const annotation = generateAnnotation(loopingState, transition);
    expect(annotation).toContain('Rejected');
    expect(annotation).toContain('loop');
  });

  // --- Terminal states without transition (Req 10.3) ---
  it('handles accepted status without transition', () => {
    const state: SimulatorState = {
      pdaDefinition: nestedParentheses,
      inputString: 'ab',
      tape: ['a', 'b', '□'],
      headPosition: 2,
      stack: [],
      currentState: 'q',
      status: 'accepted',
      history: [],
      currentStep: 3,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
    };
    const annotation = generateAnnotation(state, null);
    expect(annotation).toContain('Accepted');
  });

  it('handles rejected status without transition', () => {
    const state: SimulatorState = {
      pdaDefinition: nestedParentheses,
      inputString: 'ba',
      tape: ['b', 'a', '□'],
      headPosition: 0,
      stack: ['$'],
      currentState: 'q',
      status: 'rejected',
      history: [],
      currentStep: 1,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
    };
    const annotation = generateAnnotation(state, null);
    expect(annotation).toContain('Rejected');
  });

  it('handles looping status without transition', () => {
    const state: SimulatorState = {
      pdaDefinition: zeroNOneN,
      inputString: '10',
      tape: ['1', '0', '□'],
      headPosition: 0,
      stack: ['$'],
      currentState: 'q0',
      status: 'looping',
      history: [],
      currentStep: 2,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
    };
    const annotation = generateAnnotation(state, null);
    expect(annotation).toContain('Rejected');
    expect(annotation).toContain('loop');
  });

  // --- Formal notation format (Req 10.4) ---
  it('includes ε in formal notation when stackReplacement is empty', () => {
    const popTransition: Transition = {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: [],
      explanation: 'pop S',
    };
    const state: SimulatorState = {
      pdaDefinition: nestedParentheses,
      inputString: 'ab',
      tape: ['a', 'b', '□'],
      headPosition: 2,
      stack: ['$'],
      currentState: 'q',
      status: 'running',
      history: [],
      currentStep: 2,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: popTransition,
    };
    const annotation = generateAnnotation(state, popTransition);
    // Formal notation should show ε for empty replacement
    expect(annotation).toContain('qbS → qRε');
  });

  it('includes replacement symbols in formal notation', () => {
    const pushTransition: Transition = {
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: '$',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['$', 'S'],
      explanation: 'push S',
    };
    const state = createInitialState(nestedParentheses, 'aabb');
    const next = applyTransition(state, pushTransition);
    const annotation = generateAnnotation(next, pushTransition);
    expect(annotation).toContain('qa$ → qR$S');
  });

  // --- Fallback for running state without transition ---
  it('provides a generic description for running state without transition', () => {
    const state: SimulatorState = {
      pdaDefinition: nestedParentheses,
      inputString: 'ab',
      tape: ['a', 'b', '□'],
      headPosition: 1,
      stack: ['$', 'S'],
      currentState: 'q',
      status: 'running',
      history: [],
      currentStep: 1,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: null,
    };
    const annotation = generateAnnotation(state, null);
    expect(annotation).toContain('State q');
    expect(annotation).toContain('head at position 1');
  });

  // --- Replace operation ---
  it('describes replace operation when replacement differs from stack top', () => {
    const replaceTransition: Transition = {
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['X', 'Y'],
      explanation: 'replace S with XY',
    };
    const state: SimulatorState = {
      pdaDefinition: nestedParentheses,
      inputString: 'aa',
      tape: ['a', 'a', '□'],
      headPosition: 1,
      stack: ['$', 'X', 'Y'],
      currentState: 'q',
      status: 'running',
      history: [],
      currentStep: 1,
      branches: [],
      activeBranchId: null,
      lastAppliedTransition: replaceTransition,
    };
    const annotation = generateAnnotation(state, replaceTransition);
    expect(annotation).toContain('replace S with XY');
  });
});
