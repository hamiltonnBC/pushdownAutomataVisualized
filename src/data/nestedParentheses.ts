import type { PDADefinition } from '../types';

/**
 * PDA Example 1: Properly Nested Parentheses
 *
 * Accepts strings of properly nested parentheses using a/b for (/).
 * This is a deterministic PDA with a single state.
 */
export const nestedParentheses: PDADefinition = {
  name: 'Properly Nested Parentheses',
  description: 'Accepts strings of properly nested parentheses using a/b for (/).',
  tapeAlphabet: ['a', 'b'],
  stackAlphabet: ['$', 'S'],
  states: ['q'],
  startState: 'q',
  isNondeterministic: false,
  transitions: [
    {
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: '$',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['$', 'S'],
      explanation: "Reading '(' with empty stack: push S",
    },
    {
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['S', 'S'],
      explanation: "Reading '(' with S on top: push another S",
    },
    {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: [],
      explanation: "Reading ')' with S on top: pop S (matched pair)",
    },
    {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: '$',
      toState: 'q',
      headDirection: 'N',
      stackReplacement: [],
      explanation: "Reading ')' with empty stack: too many ')'; reject",
    },
    {
      fromState: 'q',
      tapeSymbol: '□',
      stackTop: '$',
      toState: 'q',
      headDirection: 'N',
      stackReplacement: [],
      explanation: 'End of input, stack has only $: accept',
    },
    {
      fromState: 'q',
      tapeSymbol: '□',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'N',
      stackReplacement: ['S'],
      explanation: "End of input, unmatched '(' remain: loop (reject)",
    },
  ],
  predefinedInputs: [
    { value: 'aabb', expectedResult: 'accept', description: '(())' },
    { value: 'abab', expectedResult: 'accept', description: '()()' },
    { value: 'aab', expectedResult: 'reject', description: '(()' },
    { value: 'ba', expectedResult: 'reject', description: ')(' },
    { value: '', expectedResult: 'accept', description: 'empty string' },
  ],
};
