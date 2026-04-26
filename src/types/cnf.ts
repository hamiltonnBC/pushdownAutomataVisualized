/**
 * Core type definitions for the CNF Conversion Page.
 *
 * These interfaces model a context-free grammar G = (V, Σ, R, S)
 * and the state needed for interactive step-through of the
 * 5-step Chomsky Normal Form conversion algorithm.
 */

/** A production rule A → w. */
export interface ProductionRule {
  /** Left-hand side variable */
  lhs: string;
  /** Right-hand side symbols (empty array = ε-production) */
  rhs: string[];
}

/** A context-free grammar G = (V, Σ, R, S). */
export interface Grammar {
  /** Set of variable names (uppercase letters) */
  variables: string[];
  /** Set of terminal symbols (lowercase letters or digits) */
  terminals: string[];
  /** Production rules */
  rules: ProductionRule[];
  /** Start variable */
  startVariable: string;
}

/** A single rule transformation within a conversion step. */
export interface SubStep {
  /** Which major step this belongs to (1-5) */
  stepNumber: number;
  /** Human-readable label for the major step */
  stepLabel: string;
  /** Rules removed in this sub-step */
  removedRules: ProductionRule[];
  /** Rules added in this sub-step */
  addedRules: ProductionRule[];
  /** The complete grammar state AFTER this sub-step is applied */
  grammarAfter: Grammar;
  /** Educational annotation explaining this transformation */
  annotation: string;
}

/** Status of the CNF conversion process. */
export type CnfConversionStatus = 'idle' | 'converting' | 'complete';

/** Complete state for the CNF page. */
export interface CnfConversionState {
  /** The original grammar as entered by the user */
  originalGrammar: Grammar;
  /** The current grammar (after applied sub-steps) */
  currentGrammar: Grammar;
  /** All sub-steps computed by the engine */
  subSteps: SubStep[];
  /** Index of the current sub-step (-1 = before any steps) */
  currentSubStepIndex: number;
  /** Conversion status */
  status: CnfConversionStatus;
}

/** Discriminated union of all actions for the CNF reducer. */
export type CnfAction =
  | { type: 'SET_GRAMMAR'; payload: Grammar }
  | { type: 'START_CONVERSION' }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACKWARD' }
  | { type: 'RESET' };
