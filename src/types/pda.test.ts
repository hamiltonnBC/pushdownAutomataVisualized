import { describe, it, expect } from 'vitest';
import type {
  Transition,
  PredefinedInput,
  PDADefinition,
  SimulatorSnapshot,
  ComputationBranch,
  SimulatorState,
} from './pda';

describe('PDA Type Definitions', () => {
  it('should create a valid Transition', () => {
    const transition: Transition = {
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: '$',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['$', 'S'],
      explanation: 'push S onto stack',
    };
    expect(transition.fromState).toBe('q');
    expect(transition.headDirection).toBe('R');
    expect(transition.stackReplacement).toEqual(['$', 'S']);
  });

  it('should create a valid PredefinedInput', () => {
    const input: PredefinedInput = {
      value: 'aabb',
      expectedResult: 'accept',
      description: '(())',
    };
    expect(input.expectedResult).toBe('accept');
  });

  it('should create a valid PDADefinition', () => {
    const pda: PDADefinition = {
      name: 'Test PDA',
      description: 'A test PDA',
      tapeAlphabet: ['a', 'b'],
      stackAlphabet: ['$', 'S'],
      states: ['q'],
      startState: 'q',
      transitions: [],
      isNondeterministic: false,
      predefinedInputs: [],
    };
    expect(pda.states).toContain('q');
    expect(pda.startState).toBe('q');
    expect(pda.isNondeterministic).toBe(false);
  });

  it('should create a valid SimulatorSnapshot', () => {
    const snapshot: SimulatorSnapshot = {
      step: 0,
      headPosition: 0,
      stack: ['$'],
      currentState: 'q',
      appliedTransition: null,
      annotation: 'Initial configuration',
    };
    expect(snapshot.step).toBe(0);
    expect(snapshot.appliedTransition).toBeNull();
  });

  it('should create a valid ComputationBranch', () => {
    const branch: ComputationBranch = {
      id: 'branch-1',
      parentId: null,
      snapshots: [],
      status: 'active',
    };
    expect(branch.parentId).toBeNull();
    expect(branch.status).toBe('active');
  });

  it('should create a valid SimulatorState', () => {
    const pda: PDADefinition = {
      name: 'Test PDA',
      description: 'A test PDA',
      tapeAlphabet: ['a', 'b'],
      stackAlphabet: ['$', 'S'],
      states: ['q'],
      startState: 'q',
      transitions: [],
      isNondeterministic: false,
      predefinedInputs: [],
    };

    const state: SimulatorState = {
      pdaDefinition: pda,
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
    };
    expect(state.status).toBe('ready');
    expect(state.tape).toHaveLength(5);
    expect(state.stack).toEqual(['$']);
    expect(state.activeBranchId).toBeNull();
    expect(state.lastAppliedTransition).toBeNull();
  });

  it('should support all SimulatorState status values', () => {
    const statuses: SimulatorState['status'][] = [
      'ready', 'running', 'accepted', 'rejected', 'looping',
    ];
    expect(statuses).toHaveLength(5);
  });

  it('should support all ComputationBranch status values', () => {
    const statuses: ComputationBranch['status'][] = [
      'active', 'accepted', 'rejected', 'looping',
    ];
    expect(statuses).toHaveLength(4);
  });

  it('should support both head directions', () => {
    const directions: Transition['headDirection'][] = ['R', 'N'];
    expect(directions).toHaveLength(2);
  });
});
