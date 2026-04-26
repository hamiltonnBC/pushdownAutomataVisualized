/**
 * Core type definitions for the PDA Interactive Dashboard.
 *
 * These interfaces model the Pushdown Automaton (PDA) as a 5-tuple
 * M = (Σ, Γ, Q, δ, q) and the simulator state needed for step-by-step
 * interactive simulation.
 */

/** A single transition rule in the PDA's transition function δ. */
export interface Transition {
  /** Source state (r) */
  fromState: string;
  /** Tape symbol being read: a ∈ Σ ∪ {□} */
  tapeSymbol: string;
  /** Symbol on top of the stack: A ∈ Γ */
  stackTop: string;
  /** Destination state (r') */
  toState: string;
  /** Head direction: R = move right, N = stay */
  headDirection: 'R' | 'N';
  /** Stack replacement: w ∈ Γ* (empty array = pop, array of symbols = replace) */
  stackReplacement: string[];
  /** Human-readable description of this transition */
  explanation: string;
}

/** A predefined input string bundled with a PDA example. */
export interface PredefinedInput {
  /** The input string */
  value: string;
  /** Whether the PDA should accept or reject this input */
  expectedResult: 'accept' | 'reject';
  /** Human-readable description */
  description: string;
}

/**
 * Complete PDA definition: M = (Σ, Γ, Q, δ, q).
 * Includes metadata and predefined test inputs.
 */
export interface PDADefinition {
  /** Display name of this PDA */
  name: string;
  /** Description of the language this PDA recognizes */
  description: string;
  /** Tape alphabet Σ (excludes blank symbol □) */
  tapeAlphabet: string[];
  /** Stack alphabet Γ (includes bottom-of-stack marker '$') */
  stackAlphabet: string[];
  /** Set of states Q */
  states: string[];
  /** Start state q */
  startState: string;
  /** Transition function δ */
  transitions: Transition[];
  /** Whether this PDA is nondeterministic */
  isNondeterministic: boolean;
  /** Predefined example input strings */
  predefinedInputs: PredefinedInput[];
}

/** A snapshot of the simulator at a single computation step. */
export interface SimulatorSnapshot {
  /** Step number in the computation */
  step: number;
  /** Tape head position at this step */
  headPosition: number;
  /** Stack contents (bottom to top) at this step */
  stack: string[];
  /** Current state at this step */
  currentState: string;
  /** The transition that was applied to reach this snapshot (null for initial) */
  appliedTransition: Transition | null;
  /** Human-readable annotation for this step */
  annotation: string;
}

/** A computation branch for nondeterministic PDAs. */
export interface ComputationBranch {
  /** Unique identifier for this branch */
  id: string;
  /** ID of the parent branch (null for the root branch) */
  parentId: string | null;
  /** Sequence of snapshots along this branch */
  snapshots: SimulatorSnapshot[];
  /** Current status of this branch */
  status: 'active' | 'accepted' | 'rejected' | 'looping';
}

/** The complete simulator state. */
export interface SimulatorState {
  /** The PDA being simulated */
  pdaDefinition: PDADefinition;
  /** The input string being processed */
  inputString: string;
  /** Tape contents: input symbols followed by blank □ */
  tape: string[];
  /** Current tape head position */
  headPosition: number;
  /** Stack contents, bottom to top */
  stack: string[];
  /** Current state of the PDA */
  currentState: string;
  /** Simulation status */
  status: 'ready' | 'running' | 'accepted' | 'rejected' | 'looping' | 'branching';
  /** History of computation snapshots */
  history: SimulatorSnapshot[];
  /** Current step number */
  currentStep: number;
  /** Computation branches (for nondeterministic PDAs) */
  branches: ComputationBranch[];
  /** ID of the currently active branch (null if not branching) */
  activeBranchId: string | null;
  /** The last transition that was applied */
  lastAppliedTransition: Transition | null;
}
