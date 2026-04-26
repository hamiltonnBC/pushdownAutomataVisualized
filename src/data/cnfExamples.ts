import type { Grammar } from '../types';

export interface CnfExample {
  name: string;
  description: string;
  grammar: Grammar;
}

/** Simple grammar generating 0ⁿ1ⁿ — exercises ε-elimination and unit-rule removal. */
export const zeroNOneNGrammar: CnfExample = {
  name: '0ⁿ1ⁿ',
  description: 'Generates strings of equal 0s followed by 1s. Exercises ε-elimination.',
  grammar: {
    variables: ['S'],
    terminals: ['0', '1'],
    rules: [
      { lhs: 'S', rhs: ['0', 'S', '1'] },
      { lhs: 'S', rhs: [] },
    ],
    startVariable: 'S',
  },
};

/** Balanced parentheses — has ε-rules and long rules. */
export const balancedParentheses: CnfExample = {
  name: 'Balanced Parentheses',
  description: 'Generates balanced parentheses like (), (()), ()(). Exercises long-rule breaking.',
  grammar: {
    variables: ['S'],
    terminals: ['(', ')'],
    rules: [
      { lhs: 'S', rhs: ['(', 'S', ')'] },
      { lhs: 'S', rhs: ['S', 'S'] },
      { lhs: 'S', rhs: [] },
    ],
    startVariable: 'S',
  },
};

/** Arithmetic expressions — has unit-rules, long rules, and mixed terminals. */
export const arithmeticExpressions: CnfExample = {
  name: 'Arithmetic Expressions',
  description: 'Simple arithmetic with +, ×, and parentheses. Exercises all 5 steps.',
  grammar: {
    variables: ['E', 'T', 'F'],
    terminals: ['a', '+', '*', '(', ')'],
    rules: [
      { lhs: 'E', rhs: ['E', '+', 'T'] },
      { lhs: 'E', rhs: ['T'] },
      { lhs: 'T', rhs: ['T', '*', 'F'] },
      { lhs: 'T', rhs: ['F'] },
      { lhs: 'F', rhs: ['(', 'E', ')'] },
      { lhs: 'F', rhs: ['a'] },
    ],
    startVariable: 'E',
  },
};

/** Palindromes over {a, b} — has ε-rules and unit-rules. */
export const palindromes: CnfExample = {
  name: 'Palindromes',
  description: 'Generates palindromes over {a, b}. Exercises ε-elimination and unit-rules.',
  grammar: {
    variables: ['S'],
    terminals: ['a', 'b'],
    rules: [
      { lhs: 'S', rhs: ['a', 'S', 'a'] },
      { lhs: 'S', rhs: ['b', 'S', 'b'] },
      { lhs: 'S', rhs: ['a'] },
      { lhs: 'S', rhs: ['b'] },
      { lhs: 'S', rhs: [] },
    ],
    startVariable: 'S',
  },
};

/** Textbook example — exercises all steps with multiple variables. */
export const textbookExample: CnfExample = {
  name: 'Textbook (Sipser-style)',
  description: 'Classic textbook grammar with multiple variables. Exercises all conversion steps.',
  grammar: {
    variables: ['S', 'A', 'B'],
    terminals: ['a', 'b'],
    rules: [
      { lhs: 'S', rhs: ['A', 'S', 'A'] },
      { lhs: 'S', rhs: ['a', 'B'] },
      { lhs: 'A', rhs: ['B'] },
      { lhs: 'A', rhs: ['S'] },
      { lhs: 'B', rhs: ['b'] },
      { lhs: 'B', rhs: [] },
    ],
    startVariable: 'S',
  },
};

/** All CNF grammar examples. */
export const cnfExamples: CnfExample[] = [
  zeroNOneNGrammar,
  balancedParentheses,
  arithmeticExpressions,
  palindromes,
  textbookExample,
];
