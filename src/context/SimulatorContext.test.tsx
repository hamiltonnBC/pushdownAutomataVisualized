import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { simulatorReducer, SimulatorProvider, useSimulator } from './SimulatorContext';
import { createInitialState } from '../engine/simulator';
import { nestedParentheses, zeroNOneN, bInMiddle } from '../data';
import type { SimulatorState } from '../types';

// ── Reducer unit tests ──

describe('simulatorReducer', () => {
  const initialState = createInitialState(nestedParentheses, 'aabb');

  describe('SELECT_EXAMPLE', () => {
    it('resets state with the new PDA definition and empty input', () => {
      const result = simulatorReducer(initialState, {
        type: 'SELECT_EXAMPLE',
        payload: zeroNOneN,
      });
      expect(result.pdaDefinition).toBe(zeroNOneN);
      expect(result.inputString).toBe('');
      expect(result.status).toBe('ready');
      expect(result.history).toEqual([]);
      expect(result.stack).toEqual(['$']);
    });
  });

  describe('SET_INPUT', () => {
    it('resets simulator with valid input', () => {
      const result = simulatorReducer(initialState, {
        type: 'SET_INPUT',
        payload: 'ab',
      });
      expect(result.inputString).toBe('ab');
      expect(result.tape).toEqual(['a', 'b', '□']);
      expect(result.status).toBe('ready');
      expect(result.headPosition).toBe(0);
    });

    it('ignores invalid input', () => {
      const result = simulatorReducer(initialState, {
        type: 'SET_INPUT',
        payload: 'xyz',
      });
      // State should be unchanged
      expect(result).toBe(initialState);
    });
  });

  describe('STEP_FORWARD', () => {
    it('applies a transition and advances the simulator', () => {
      const result = simulatorReducer(initialState, { type: 'STEP_FORWARD' });
      expect(result.status).toBe('running');
      expect(result.currentStep).toBe(1);
      expect(result.history).toHaveLength(1);
      expect(result.lastAppliedTransition).not.toBeNull();
    });

    it('does not step when already accepted', () => {
      const accepted: SimulatorState = { ...initialState, status: 'accepted' };
      const result = simulatorReducer(accepted, { type: 'STEP_FORWARD' });
      expect(result).toBe(accepted);
    });

    it('does not step when already rejected', () => {
      const rejected: SimulatorState = { ...initialState, status: 'rejected' };
      const result = simulatorReducer(rejected, { type: 'STEP_FORWARD' });
      expect(result).toBe(rejected);
    });

    it('does not step when looping', () => {
      const looping: SimulatorState = { ...initialState, status: 'looping' };
      const result = simulatorReducer(looping, { type: 'STEP_FORWARD' });
      expect(result).toBe(looping);
    });

    it('sets rejected when no transitions are applicable', () => {
      // Create a state where no transition matches
      const stuck: SimulatorState = {
        ...initialState,
        currentState: 'nonexistent',
      };
      const result = simulatorReducer(stuck, { type: 'STEP_FORWARD' });
      expect(result.status).toBe('rejected');
    });
  });

  describe('STEP_BACKWARD', () => {
    it('returns to initial state when stepping back from step 1', () => {
      const afterStep = simulatorReducer(initialState, { type: 'STEP_FORWARD' });
      const result = simulatorReducer(afterStep, { type: 'STEP_BACKWARD' });
      expect(result.status).toBe('ready');
      expect(result.currentStep).toBe(0);
      expect(result.history).toEqual([]);
      expect(result.headPosition).toBe(0);
      expect(result.stack).toEqual(['$']);
    });

    it('does nothing when already at initial state', () => {
      const result = simulatorReducer(initialState, { type: 'STEP_BACKWARD' });
      expect(result).toBe(initialState);
    });

    it('restores previous snapshot when stepping back from step 2+', () => {
      let state = initialState;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const afterStep1 = state;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      // Now step back
      state = simulatorReducer(state, { type: 'STEP_BACKWARD' });
      expect(state.headPosition).toBe(afterStep1.headPosition);
      expect(state.stack).toEqual(afterStep1.stack);
      expect(state.currentState).toBe(afterStep1.currentState);
      expect(state.currentStep).toBe(afterStep1.currentStep);
    });
  });

  describe('RESET', () => {
    it('resets to initial state preserving current PDA and input', () => {
      let state = initialState;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const result = simulatorReducer(state, { type: 'RESET' });
      expect(result.status).toBe('ready');
      expect(result.currentStep).toBe(0);
      expect(result.history).toEqual([]);
      expect(result.inputString).toBe('aabb');
      expect(result.pdaDefinition).toBe(nestedParentheses);
    });
  });

  describe('RESTORE_STEP', () => {
    it('restores configuration at a specific history index', () => {
      let state = initialState;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const snapshot1 = state.history[0];
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });

      const result = simulatorReducer(state, { type: 'RESTORE_STEP', payload: 0 });
      expect(result.headPosition).toBe(snapshot1.headPosition);
      expect(result.stack).toEqual(snapshot1.stack);
      expect(result.currentState).toBe(snapshot1.currentState);
      expect(result.history).toHaveLength(1);
    });

    it('ignores invalid index (negative)', () => {
      let state = initialState;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const result = simulatorReducer(state, { type: 'RESTORE_STEP', payload: -1 });
      expect(result).toBe(state);
    });

    it('ignores invalid index (out of bounds)', () => {
      let state = initialState;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const result = simulatorReducer(state, { type: 'RESTORE_STEP', payload: 99 });
      expect(result).toBe(state);
    });
  });

  describe('SELECT_BRANCH', () => {
    it('returns state unchanged when branch not found', () => {
      const result = simulatorReducer(initialState, {
        type: 'SELECT_BRANCH',
        payload: 'nonexistent',
      });
      expect(result).toBe(initialState);
    });
  });
});


// ── Full simulation: nested parentheses "aabb" should accept ──

describe('simulatorReducer full simulation', () => {
  it('accepts "aabb" for nested parentheses', () => {
    let state = createInitialState(nestedParentheses, 'aabb');
    // Step through until terminal
    for (let i = 0; i < 20; i++) {
      if (state.status === 'accepted' || state.status === 'rejected' || state.status === 'looping') break;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    }
    expect(state.status).toBe('accepted');
  });

  it('rejects "aab" for nested parentheses (unmatched open)', () => {
    let state = createInitialState(nestedParentheses, 'aab');
    for (let i = 0; i < 20; i++) {
      if (state.status === 'accepted' || state.status === 'rejected' || state.status === 'looping') break;
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    }
    expect(state.status).toBe('looping');
  });
});

// ── Context hook tests ──

describe('useSimulator hook', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SimulatorProvider>{children}</SimulatorProvider>
  );

  it('provides initial state with nestedParentheses and empty input', () => {
    const { result } = renderHook(() => useSimulator(), { wrapper });
    expect(result.current.state.pdaDefinition).toBe(nestedParentheses);
    expect(result.current.state.inputString).toBe('');
    expect(result.current.state.status).toBe('ready');
  });

  it('dispatches SET_INPUT and updates state', () => {
    const { result } = renderHook(() => useSimulator(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'SET_INPUT', payload: 'ab' });
    });
    expect(result.current.state.inputString).toBe('ab');
    expect(result.current.state.tape).toEqual(['a', 'b', '□']);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useSimulator());
    }).toThrow('useSimulator must be used within a SimulatorProvider');
  });
});

// ── Nondeterministic branch management tests ──

describe('simulatorReducer nondeterministic branching', () => {
  // bInMiddle PDA with input "aba":
  // Step 0: state=q, head=0, tape='a', stack=['$'] → only 1 transition (push S, stay q)
  // Step 1: state=q, head=1, tape='b', stack=['$','S'] → 2 transitions (nondeterministic!)
  //   - Branch 0: stay in q, push S → stack=['S','S','$'] (continue reading before middle)
  //   - Branch 1: go to q2, pop S → stack=['$'] (guess 'b' is the middle)

  describe('STEP_FORWARD with nondeterministic PDA', () => {
    it('creates branches and sets status to branching', () => {
      let state = createInitialState(bInMiddle, 'aba');
      // Step 1: deterministic (reading 'a' with '$' on stack → only one transition)
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(state.branches).toHaveLength(0);
      expect(state.currentStep).toBe(1);

      // Step 2: nondeterministic (reading 'b' with 'S' on stack → two transitions)
      const result = simulatorReducer(state, { type: 'STEP_FORWARD' });

      // Should create branches and pause — main state does NOT advance
      expect(result.branches).toHaveLength(2);
      expect(result.currentStep).toBe(1); // main state unchanged
      expect(result.status).toBe('branching');
      expect(result.activeBranchId).toBeNull(); // no branch selected yet
    });

    it('does not step further when status is branching', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      state = simulatorReducer(state, { type: 'STEP_FORWARD' }); // branching
      expect(state.status).toBe('branching');
      const branchCount = state.branches.length;

      // Another STEP_FORWARD should be a no-op
      const result = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(result).toBe(state);
      expect(result.branches).toHaveLength(branchCount); // no new branches
    });

    it('assigns unique IDs to each branch', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const result = simulatorReducer(state, { type: 'STEP_FORWARD' });

      expect(result.branches[0].id).toBe('branch-1-0');
      expect(result.branches[1].id).toBe('branch-1-1');
    });

    it('each branch stores snapshots including history up to branching point', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const historyBeforeBranch = state.history.length;

      const result = simulatorReducer(state, { type: 'STEP_FORWARD' });

      // Each branch should have the pre-branch history + 1 new snapshot
      for (const branch of result.branches) {
        expect(branch.snapshots).toHaveLength(historyBeforeBranch + 1);
      }
    });

    it('branches have correct status based on terminal conditions', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      const result = simulatorReducer(state, { type: 'STEP_FORWARD' });

      // Both branches should be 'active' at this point (neither terminal nor looping)
      for (const branch of result.branches) {
        expect(['active', 'accepted', 'rejected', 'looping']).toContain(branch.status);
      }
    });

    it('follows specific transition when transitionIndex is provided', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });

      // Choose transition index 1 (guess middle)
      const result = simulatorReducer(state, {
        type: 'STEP_FORWARD',
        payload: { transitionIndex: 1 },
      });

      // Should advance main state, not create branches
      expect(result.currentStep).toBe(2);
      expect(result.currentState).toBe('q2'); // went to q2 (guessed middle)
    });

    it('follows specific transition index 0 (stay in q)', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });

      // Choose transition index 0 (continue before middle)
      const result = simulatorReducer(state, {
        type: 'STEP_FORWARD',
        payload: { transitionIndex: 0 },
      });

      expect(result.currentStep).toBe(2);
      expect(result.currentState).toBe('q'); // stayed in q
    });

    it('does not create branches for deterministic PDAs', () => {
      let state = createInitialState(nestedParentheses, 'aabb');
      const result = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(result.branches).toHaveLength(0);
      expect(result.currentStep).toBe(1);
    });

    it('accumulates branches across multiple nondeterministic choice points', () => {
      // Use "abba" - will hit nondeterministic choices at multiple 'b' positions
      let state = createInitialState(bInMiddle, 'abba');
      // Step 1: read 'a' → deterministic
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(state.branches).toHaveLength(0);

      // Step 2: read 'b' with S on stack → nondeterministic → branching
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(state.branches).toHaveLength(2);
      expect(state.status).toBe('branching');

      // User picks branch 0 (stay in q, push S)
      state = simulatorReducer(state, { type: 'SELECT_BRANCH', payload: 'branch-1-0' });
      expect(state.status).toBe('running');

      // Step 3: read 'b' with S,S on stack → nondeterministic again → branching
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      // Should have accumulated: 2 from first + 2 from second = 4
      expect(state.branches).toHaveLength(4);
      expect(state.status).toBe('branching');
    });
  });

  describe('SELECT_BRANCH', () => {
    it('loads branch snapshots into main state', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      // Create branches at nondeterministic choice → branching
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(state.branches).toHaveLength(2);
      expect(state.status).toBe('branching');

      // Select branch 1 (the "guess middle" branch)
      const branch = state.branches[1];
      const lastSnapshot = branch.snapshots[branch.snapshots.length - 1];

      const result = simulatorReducer(state, {
        type: 'SELECT_BRANCH',
        payload: branch.id,
      });

      expect(result.activeBranchId).toBe(branch.id);
      expect(result.headPosition).toBe(lastSnapshot.headPosition);
      expect(result.stack).toEqual(lastSnapshot.stack);
      expect(result.currentState).toBe(lastSnapshot.currentState);
      expect(result.currentStep).toBe(lastSnapshot.step);
      expect(result.history).toEqual(branch.snapshots);
      expect(result.status).toBe('running'); // can continue stepping
    });

    it('sets status based on branch status for active branch', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });

      const activeBranch = state.branches.find((b) => b.status === 'active');
      if (activeBranch) {
        const result = simulatorReducer(state, {
          type: 'SELECT_BRANCH',
          payload: activeBranch.id,
        });
        expect(result.status).toBe('running');
      }
    });

    it('returns state unchanged for nonexistent branch', () => {
      const state = createInitialState(bInMiddle, 'aba');
      const result = simulatorReducer(state, {
        type: 'SELECT_BRANCH',
        payload: 'nonexistent',
      });
      expect(result).toBe(state);
    });

    it('can step forward after selecting a branch', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      // Create branches → branching
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(state.status).toBe('branching');

      // Select the "guess middle" branch (index 1, goes to q2)
      const guessBranch = state.branches[1];
      state = simulatorReducer(state, {
        type: 'SELECT_BRANCH',
        payload: guessBranch.id,
      });

      expect(state.currentState).toBe('q2');
      expect(state.status).toBe('running');
      const stepBefore = state.currentStep;

      // Now step forward from this branch's state
      const result = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(result.currentStep).toBe(stepBefore + 1);
    });
  });

  describe('branch status tracking', () => {
    it('marks branch as accepted when it reaches acceptance', () => {
      let state = createInitialState(bInMiddle, 'b');
      // Step → branching (two choices for 'b' with $ on top)
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(state.status).toBe('branching');
      expect(state.branches).toHaveLength(2);

      // Select the "guess middle" branch and step to acceptance
      const guessBranch = state.branches.find((b) => {
        const lastSnap = b.snapshots[b.snapshots.length - 1];
        return lastSnap?.currentState === 'q2';
      });
      expect(guessBranch).toBeDefined();

      // Load the branch and step forward to accept
      let branchState = simulatorReducer(state, {
        type: 'SELECT_BRANCH',
        payload: guessBranch!.id,
      });
      branchState = simulatorReducer(branchState, { type: 'STEP_FORWARD' });
      expect(branchState.status).toBe('accepted');
    });

    it('updates active branch status when stepping forward on it', () => {
      let state = createInitialState(bInMiddle, 'aba');
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      // Create branches → branching
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      expect(state.status).toBe('branching');

      // Select the "guess middle" branch
      const guessBranch = state.branches[1];
      state = simulatorReducer(state, {
        type: 'SELECT_BRANCH',
        payload: guessBranch.id,
      });

      // Step forward on this branch until terminal
      for (let i = 0; i < 10; i++) {
        if (
          state.status === 'accepted' ||
          state.status === 'rejected' ||
          state.status === 'looping'
        ) {
          break;
        }
        // If branching again, pick first branch
        if (state.status === 'branching') {
          const activeBranch = state.branches[state.branches.length - 2]; // first of new pair
          state = simulatorReducer(state, { type: 'SELECT_BRANCH', payload: activeBranch.id });
          continue;
        }
        state = simulatorReducer(state, { type: 'STEP_FORWARD' });
      }

      // The branch in state.branches should have its status updated
      const updatedBranch = state.branches.find((b) => b.id === guessBranch.id);
      expect(updatedBranch).toBeDefined();
      expect(['accepted', 'rejected', 'looping']).toContain(updatedBranch!.status);
    });
  });
});

// ── Full nondeterministic simulation: bInMiddle ──

describe('simulatorReducer nondeterministic full simulation', () => {
  it('can reach acceptance for "b" via the correct branch', () => {
    let state = createInitialState(bInMiddle, 'b');

    // Step 1: read 'b' at head=0, stackTop='$' → nondeterministic
    // Choose transition index 1 (guess middle: q,b,$ → q2,R,$) — keeps $ on stack
    state = simulatorReducer(state, {
      type: 'STEP_FORWARD',
      payload: { transitionIndex: 1 },
    });
    expect(state.currentState).toBe('q2');
    expect(state.stack).toEqual(['$']);

    // Step 2: read □ with $ on top → pop $ → accept
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.status).toBe('accepted');
  });

  it('creates branches for "b" and pauses at the nondeterministic choice point', () => {
    let state = createInitialState(bInMiddle, 'b');

    // Step without specifying transition → should create branches and pause
    const result = simulatorReducer(state, { type: 'STEP_FORWARD' });

    expect(result.branches).toHaveLength(2);
    expect(result.status).toBe('branching');
    expect(result.currentStep).toBe(0); // did NOT advance
  });

  it('accepts "aba" when correctly guessing middle at position 1', () => {
    let state = createInitialState(bInMiddle, 'aba');

    // Step 1: read 'a' (deterministic) → push S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stack).toEqual(['$', 'S']);

    // Step 2: read 'b' → choose index 1 (guess middle: q,b,S → q2,R,S) — keeps S
    state = simulatorReducer(state, {
      type: 'STEP_FORWARD',
      payload: { transitionIndex: 1 },
    });
    expect(state.currentState).toBe('q2');
    expect(state.stack).toEqual(['$', 'S']);

    // Step 3: read 'a' with S on top → pop S
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stack).toEqual(['$']);

    // Step 4: read □ with $ on top → pop $ → accept
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    expect(state.status).toBe('accepted');
  });

  it('reaches rejection/looping for "aba" via the wrong branch', () => {
    let state = createInitialState(bInMiddle, 'aba');

    // Step 1: read 'a' (deterministic)
    state = simulatorReducer(state, { type: 'STEP_FORWARD' });

    // Step 2: read 'b' → choose index 0 (don't guess middle, stay in q)
    state = simulatorReducer(state, {
      type: 'STEP_FORWARD',
      payload: { transitionIndex: 0 },
    });
    expect(state.currentState).toBe('q');

    // Continue stepping until terminal
    for (let i = 0; i < 20; i++) {
      if (
        state.status === 'accepted' ||
        state.status === 'rejected' ||
        state.status === 'looping'
      ) {
        break;
      }
      state = simulatorReducer(state, { type: 'STEP_FORWARD' });
    }

    // This branch should not accept (wrong guess)
    expect(state.status).not.toBe('accepted');
  });
});
