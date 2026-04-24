import type {
  PDADefinition,
  SimulatorState,
  SimulatorSnapshot,
  Transition,
} from '../types';

/**
 * Creates the initial simulator state for a given PDA definition and input string.
 *
 * Sets up the tape (input chars + blank '□'), head at position 0,
 * stack with just the bottom marker ['$'], current state = start state,
 * and status = 'ready'.
 */
export function createInitialState(
  definition: PDADefinition,
  inputString: string,
): SimulatorState {
  const tape = [...inputString.split(''), '□'];
  return {
    pdaDefinition: definition,
    inputString,
    tape,
    headPosition: 0,
    stack: ['$'],
    currentState: definition.startState,
    status: 'ready',
    history: [],
    currentStep: 0,
    branches: [],
    activeBranchId: null,
    lastAppliedTransition: null,
  };
}

/**
 * Returns all transitions from the PDA definition that match the given
 * (state, tapeSymbol, stackTop) triple.
 */
export function getApplicableTransitions(
  definition: PDADefinition,
  state: string,
  tapeSymbol: string,
  stackTop: string,
): Transition[] {
  return definition.transitions.filter(
    (t) =>
      t.fromState === state &&
      t.tapeSymbol === tapeSymbol &&
      t.stackTop === stackTop,
  );
}

/**
 * Applies a single transition to the simulator state, returning a new state.
 *
 * Stack replacement logic:
 * 1. Remove the top of the stack (pop).
 * 2. Push stackReplacement symbols in order — first element goes deepest,
 *    last element becomes the new top.
 *
 * If stackReplacement is empty, the top is simply popped.
 *
 * Head movement: 'R' increments headPosition by 1, 'N' keeps it the same.
 *
 * Records a snapshot in history, updates currentStep, sets lastAppliedTransition,
 * and sets status to 'running'.
 */
export function applyTransition(
  state: SimulatorState,
  transition: Transition,
): SimulatorState {
  // Build new stack: pop top, then push replacement symbols
  const newStack = state.stack.slice(0, -1);
  for (const symbol of transition.stackReplacement) {
    newStack.push(symbol);
  }

  // Head movement
  const newHeadPosition =
    transition.headDirection === 'R'
      ? state.headPosition + 1
      : state.headPosition;

  const newStep = state.currentStep + 1;

  // Record snapshot of the new configuration
  const snapshot: SimulatorSnapshot = {
    step: newStep,
    headPosition: newHeadPosition,
    stack: [...newStack],
    currentState: transition.toState,
    appliedTransition: transition,
    annotation: transition.explanation,
  };

  return {
    ...state,
    stack: newStack,
    headPosition: newHeadPosition,
    currentState: transition.toState,
    status: 'running',
    history: [...state.history, snapshot],
    currentStep: newStep,
    lastAppliedTransition: transition,
  };
}

/**
 * Returns true when the PDA is in a terminal configuration —
 * i.e., the stack is empty (length === 0, meaning '$' was popped).
 */
export function isTerminal(state: SimulatorState): boolean {
  return state.stack.length === 0;
}

/**
 * Returns true when the PDA accepts the input:
 * stack is empty AND head is positioned on the blank cell
 * after the last input symbol (headPosition === inputString.length).
 */
export function isAccepted(state: SimulatorState): boolean {
  return state.stack.length === 0 && state.headPosition === state.inputString.length;
}

/**
 * Detects whether the PDA is in a looping (non-terminating) configuration.
 *
 * Returns true if the current configuration (currentState, headPosition, stack)
 * matches any previous snapshot in the history. This catches stuck configurations
 * where the head stays put (N) and the stack is unchanged.
 */
export function detectLoop(state: SimulatorState): boolean {
  const currentState = state.currentState;
  const currentHead = state.headPosition;
  const currentStackKey = state.stack.join(',');

  // Compare against all previous snapshots except the last one,
  // since the last snapshot represents the current configuration itself.
  const previousSnapshots = state.history.slice(0, -1);

  return previousSnapshots.some(
    (snap) =>
      snap.currentState === currentState &&
      snap.headPosition === currentHead &&
      snap.stack.join(',') === currentStackKey,
  );
}

/**
 * Generates a human-readable annotation for the current computation step,
 * referencing formal PDA notation.
 *
 * - When transition is null and status is 'ready': describes the initial setup.
 * - When a transition is provided: describes the transition using formal notation
 *   (e.g., "Applying transition raA → r'ℓw: reading 'X' with Y on top, push Z").
 * - When the state is terminal (accepted): explains acceptance.
 * - When the state is terminal (rejected/looping): explains rejection.
 */
export function generateAnnotation(
  state: SimulatorState,
  transition: Transition | null,
): string {
  // Case 1: Initial / ready state with no transition
  if (transition === null && state.status === 'ready') {
    const input = state.inputString === '' ? 'ε (empty string)' : `"${state.inputString}"`;
    return `Start configuration: state ${state.currentState}, input ${input} on tape, stack initialized with $.`;
  }

  // Case 2: A transition was applied
  if (transition !== null) {
    const formalNotation = formatTransitionNotation(transition);
    const stackOp = describeStackOperation(transition);
    const symbolDesc =
      transition.tapeSymbol === '□' ? 'blank □' : `'${transition.tapeSymbol}'`;

    let annotation =
      `Applying transition ${formalNotation}: reading ${symbolDesc} with ${transition.stackTop} on top, ${stackOp}.`;

    // Check for terminal conditions after this transition
    if (state.stack.length === 0) {
      if (state.headPosition === state.inputString.length) {
        annotation +=
          ' Accepted: stack is empty and head is past the last input symbol.';
      } else {
        annotation +=
          ' Rejected: stack is empty but head has not reached the end of input.';
      }
    }

    if (state.status === 'looping') {
      annotation +=
        ' Rejected: configuration repeated — the PDA is in a loop.';
    }

    return annotation;
  }

  // Case 3: Terminal states without a transition (e.g. status set externally)
  if (state.status === 'accepted') {
    return 'Accepted: stack is empty and head is past the last input symbol.';
  }

  if (state.status === 'rejected') {
    return 'Rejected: no valid transition available from the current configuration.';
  }

  if (state.status === 'looping') {
    return 'Rejected: configuration repeated — the PDA is in a loop.';
  }

  return `State ${state.currentState}, head at position ${state.headPosition}, stack: [${state.stack.join(', ')}].`;
}

/**
 * Formats a transition in the formal notation: raA → r'ℓw
 */
function formatTransitionNotation(transition: Transition): string {
  const w =
    transition.stackReplacement.length === 0
      ? 'ε'
      : transition.stackReplacement.join('');
  return `${transition.fromState}${transition.tapeSymbol}${transition.stackTop} → ${transition.toState}${transition.headDirection}${w}`;
}

/**
 * Describes the stack operation performed by a transition in human-readable text.
 */
function describeStackOperation(transition: Transition): string {
  const { stackTop, stackReplacement } = transition;

  if (stackReplacement.length === 0) {
    return `pop ${stackTop}`;
  }

  if (
    stackReplacement.length === 1 &&
    stackReplacement[0] === stackTop
  ) {
    return `keep ${stackTop} on stack`;
  }

  // Check if it's a push (stackTop is preserved at bottom of replacement)
  if (stackReplacement[0] === stackTop && stackReplacement.length > 1) {
    const pushed = stackReplacement.slice(1).join('');
    return `push ${pushed} onto stack`;
  }

  return `replace ${stackTop} with ${stackReplacement.join('')}`;
}

/**
 * Validates that every character in the input string belongs to the tape alphabet.
 *
 * Returns `{ valid: true, invalidSymbols: [] }` when all characters are in the alphabet
 * (including the empty string case). Otherwise returns `valid: false` with the unique
 * set of characters that are not in the alphabet.
 */
export function validateInput(
  input: string,
  tapeAlphabet: string[],
): { valid: boolean; invalidSymbols: string[] } {
  const alphabetSet = new Set(tapeAlphabet);
  const invalidSet = new Set<string>();

  for (const ch of input) {
    if (!alphabetSet.has(ch)) {
      invalidSet.add(ch);
    }
  }

  const invalidSymbols = [...invalidSet];
  return { valid: invalidSymbols.length === 0, invalidSymbols };
}
