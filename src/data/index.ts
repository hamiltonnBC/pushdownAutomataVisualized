export { nestedParentheses } from './nestedParentheses';
export { zeroNOneN } from './zeroNOneN';
export { bInMiddle } from './bInMiddle';

import type { PDADefinition } from '../types';
import { nestedParentheses } from './nestedParentheses';
import { zeroNOneN } from './zeroNOneN';
import { bInMiddle } from './bInMiddle';

/** All three PDA example definitions. */
export const allExamples: PDADefinition[] = [
  nestedParentheses,
  zeroNOneN,
  bInMiddle,
];
