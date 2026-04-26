import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { PDADefinition, SimulatorState, ComputationBranch, SimulatorSnapshot } from '../types';
import {
  createInitialState,
  getApplicableTransitions,
  applyTransition,
  isTerminal,
  isAccepted,
  detectLoop,
  validateInput,
} from '../engine/simulator';
import { nestedParentheses } from '../data';

// ── Action types ──

export type SimulatorAction =
  | { type: 'SELECT_EXAMPLE'; payload: PDADefinition }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'STEP_FORWARD'; payload?: { transitionIndex?: number } }
  | { type: 'STEP_BACKWARD' }
  | { type: 'RESET' }
  | { type: 'SELECT_BRANCH'; payload: string }
  | { type: 'RESTORE_STEP'; payload: number };

// ── Reducer ──

export function simulatorReducer(
  state: SimulatorState,
  action: SimulatorAction,
): SimulatorState {
  switch (action.type) {
    case 'SELECT_EXAMPLE': {
      return createInitialState(action.payload, '');
    }

    case 'SET_INPUT': {
      const input = action.payload;
      const { valid } = validateInput(input, state.pdaDefinition.tapeAlphabet);
      if (!valid) {
        return state;
      }
      return createInitialState(state.pdaDefinition, input);
    }

    case 'STEP_FORWARD': {
      // Don't step if already in a terminal or branching status
      if (
        state.status === 'accepted' ||
        state.status === 'rejected' ||
        state.status === 'looping' ||
        state.status === 'branching'
      ) {
        return state;
      }

      const tapeSymbol = state.tape[state.headPosition] ?? '□';
      const stackTop = state.stack[state.stack.length - 1] ?? '□';

      const transitions = getApplicableTransitions(
        state.pdaDefinition,
        state.currentState,
        tapeSymbol,
        stackTop,
      );

      // No applicable transitions → rejected
      if (transitions.length === 0) {
        return { ...state, status: 'rejected' };
      }

      // Nondeterministic branching: multiple transitions and no specific index chosen
      const isNondeterministicChoice =
        state.pdaDefinition.isNondeterministic &&
        transitions.length > 1 &&
        action.payload?.transitionIndex === undefined;

      if (isNondeterministicChoice) {
        // Create a branch for each possible transition
        const newBranches: ComputationBranch[] = transitions.map(
          (transition, index) => {
            const branchState = applyTransition(state, transition);

            let branchStatus: ComputationBranch['status'] = 'active';
            if (isTerminal(branchState)) {
              branchStatus = isAccepted(branchState) ? 'accepted' : 'rejected';
            } else if (detectLoop(branchState)) {
              branchStatus = 'looping';
            }

            const snapshot: SimulatorSnapshot = {
              step: state.currentStep + 1,
              headPosition: branchState.headPosition,
              stack: [...branchState.stack],
              currentState: branchState.currentState,
              appliedTransition: transition,
              annotation: transition.explanation,
            };

            return {
              id: `branch-${state.currentStep}-${index}`,
              parentId: state.activeBranchId,
              snapshots: [...state.history, snapshot],
              status: branchStatus,
            };
          },
        );

        // Pause and wait for the user to pick a branch via SELECT_BRANCH.
        return {
          ...state,
          branches: [...state.branches, ...newBranches],
          status: 'branching',
        };
      }

      // Deterministic step or specific transition chosen
      const transitionIndex = action.payload?.transitionIndex ?? 0;
      const transition = transitions[Math.min(transitionIndex, transitions.length - 1)];

      // Apply the transition
      let newState = applyTransition(state, transition);

      // Check terminal conditions
      if (isTerminal(newState)) {
        newState = {
          ...newState,
          status: isAccepted(newState) ? 'accepted' : 'rejected',
        };
      } else if (detectLoop(newState)) {
        newState = { ...newState, status: 'looping' };
      }

      // Update the active branch's snapshots and status if we're on a branch
      if (state.activeBranchId) {
        const updatedBranches = state.branches.map((b) => {
          if (b.id === state.activeBranchId) {
            return {
              ...b,
              snapshots: [...newState.history],
              status:
                newState.status === 'accepted'
                  ? ('accepted' as const)
                  : newState.status === 'rejected'
                    ? ('rejected' as const)
                    : newState.status === 'looping'
                      ? ('looping' as const)
                      : ('active' as const),
            };
          }
          return b;
        });
        newState = { ...newState, branches: updatedBranches };
      }

      return newState;
    }

    case 'STEP_BACKWARD': {
      // Can't step back from the initial state
      if (state.history.length === 0) {
        return state;
      }

      // If there's only one snapshot, going back means restoring initial state
      if (state.history.length === 1) {
        return createInitialState(state.pdaDefinition, state.inputString);
      }

      // Pop the last history entry and restore the previous snapshot
      const newHistory = state.history.slice(0, -1);
      const previousSnapshot = newHistory[newHistory.length - 1];

      return {
        ...state,
        headPosition: previousSnapshot.headPosition,
        stack: [...previousSnapshot.stack],
        currentState: previousSnapshot.currentState,
        currentStep: previousSnapshot.step,
        history: newHistory,
        status: 'running',
        lastAppliedTransition: previousSnapshot.appliedTransition,
      };
    }

    case 'RESET': {
      return createInitialState(state.pdaDefinition, state.inputString);
    }

    case 'SELECT_BRANCH': {
      const branch = state.branches.find((b) => b.id === action.payload);
      if (!branch) {
        return state;
      }

      // If the branch has no snapshots, just set the active branch ID
      if (branch.snapshots.length === 0) {
        return { ...state, activeBranchId: action.payload };
      }

      // Load the branch's last snapshot into the main state
      const lastSnapshot = branch.snapshots[branch.snapshots.length - 1];

      return {
        ...state,
        activeBranchId: action.payload,
        headPosition: lastSnapshot.headPosition,
        stack: [...lastSnapshot.stack],
        currentState: lastSnapshot.currentState,
        currentStep: lastSnapshot.step,
        history: [...branch.snapshots],
        status:
          branch.status === 'active' ? 'running' : branch.status,
        lastAppliedTransition: lastSnapshot.appliedTransition,
      };
    }

    case 'RESTORE_STEP': {
      const targetIndex = action.payload;

      // Validate the index
      if (targetIndex < 0 || targetIndex >= state.history.length) {
        return state;
      }

      // Restoring to step 0 means going back to the first snapshot
      const snapshot = state.history[targetIndex];
      const restoredHistory = state.history.slice(0, targetIndex + 1);

      return {
        ...state,
        headPosition: snapshot.headPosition,
        stack: [...snapshot.stack],
        currentState: snapshot.currentState,
        currentStep: snapshot.step,
        history: restoredHistory,
        status: 'running',
        lastAppliedTransition: snapshot.appliedTransition,
      };
    }

    default:
      return state;
  }
}


// ── Context ──

interface SimulatorContextValue {
  state: SimulatorState;
  dispatch: React.Dispatch<SimulatorAction>;
}

export const SimulatorContext = createContext<SimulatorContextValue | null>(null);

// ── Provider ──

interface SimulatorProviderProps {
  children: ReactNode;
}

export function SimulatorProvider({ children }: SimulatorProviderProps) {
  const [state, dispatch] = useReducer(
    simulatorReducer,
    nestedParentheses,
    (def) => createInitialState(def, ''),
  );

  return (
    <SimulatorContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulatorContext.Provider>
  );
}

// ── Hook ──

export function useSimulator(): SimulatorContextValue {
  const context = useContext(SimulatorContext);
  if (context === null) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
}
