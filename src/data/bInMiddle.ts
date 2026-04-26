import type { PDADefinition } from '../types';

/**
 * PDA Example 3: Strings with b in the middle (Nondeterministic)
 *
 * Accepts strings in {a,b}* of odd length whose middle symbol is b.
 * This is a nondeterministic PDA — it guesses when it has reached the middle.
 */
export const bInMiddle: PDADefinition = {
  name: 'Strings with b in the middle',
  description:
    'Accepts strings in {a,b}* of odd length whose middle symbol is b. Nondeterministic.',
  tapeAlphabet: ['a', 'b'],
  stackAlphabet: ['$', 'S'],
  states: ['q', 'q2'],
  startState: 'q',
  isNondeterministic: true,
  transitions: [
    // State q: haven't reached middle yet
    {
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: '$',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['$', 'S'],
      explanation: "Reading 'a' before middle: push S, stay in q",
    },
    {
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['S', 'S'],
      explanation: "Reading 'a' before middle: push S, stay in q",
    },
    {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: '$',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['$', 'S'],
      explanation: "Reading 'b' before middle: push S, stay in q",
    },
    {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['S', 'S'],
      explanation: "Reading 'b' before middle: push S, stay in q",
    },
    // Nondeterministic choice: guess that current 'b' is the middle
    {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: '$',
      toState: 'q2',
      headDirection: 'R',
      stackReplacement: ['$'],
      explanation: "Guess: this 'b' is the middle symbol, keep $ on stack",
    },
    {
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: 'S',
      toState: 'q2',
      headDirection: 'R',
      stackReplacement: ['S'],
      explanation: "Guess: this 'b' is the middle symbol, keep S on stack",
    },
    // State q2: past the middle, pop for each symbol read
    {
      fromState: 'q2',
      tapeSymbol: 'a',
      stackTop: 'S',
      toState: 'q2',
      headDirection: 'R',
      stackReplacement: [],
      explanation: "Past middle, reading 'a': pop S",
    },
    {
      fromState: 'q2',
      tapeSymbol: 'b',
      stackTop: 'S',
      toState: 'q2',
      headDirection: 'R',
      stackReplacement: [],
      explanation: "Past middle, reading 'b': pop S",
    },
    {
      fromState: 'q2',
      tapeSymbol: '□',
      stackTop: '$',
      toState: 'q2',
      headDirection: 'N',
      stackReplacement: [],
      explanation: 'End of input, stack has only $: accept',
    },
    // Rejection cases in q2: stack empty (only $ left) but input remains
    {
      fromState: 'q2',
      tapeSymbol: 'a',
      stackTop: '$',
      toState: 'q2',
      headDirection: 'N',
      stackReplacement: [],
      explanation: 'Stack empty but input remains: terminate and reject',
    },
    {
      fromState: 'q2',
      tapeSymbol: 'b',
      stackTop: '$',
      toState: 'q2',
      headDirection: 'N',
      stackReplacement: [],
      explanation: 'Stack empty but input remains: terminate and reject',
    },
    {
      fromState: 'q2',
      tapeSymbol: '□',
      stackTop: 'S',
      toState: 'q2',
      headDirection: 'N',
      stackReplacement: ['S'],
      explanation: 'End of input but stack not empty: loop (reject)',
    },
    // q reading blank
    {
      fromState: 'q',
      tapeSymbol: '□',
      stackTop: '$',
      toState: 'q',
      headDirection: 'N',
      stackReplacement: ['$'],
      explanation:
        'End of input in state q: never guessed middle; loop (reject)',
    },
    {
      fromState: 'q',
      tapeSymbol: '□',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'N',
      stackReplacement: ['S'],
      explanation:
        'End of input in state q: never guessed middle; loop (reject)',
    },
  ],
  predefinedInputs: [
    { value: 'aba', expectedResult: 'accept', description: 'a·b·a (middle is b)' },
    { value: 'aabaa', expectedResult: 'accept', description: 'aa·b·aa (middle is b)' },
    { value: 'abba', expectedResult: 'reject', description: 'even length, no single middle' },
    { value: 'bb', expectedResult: 'reject', description: 'even length' },
    { value: 'ab', expectedResult: 'reject', description: 'even length' },
    { value: 'aabba', expectedResult: 'accept', description: 'aa·b·ba (middle is b)' },
    { value: 'aaaba', expectedResult: 'reject', description: 'middle is a, not b' },
  ],
};
