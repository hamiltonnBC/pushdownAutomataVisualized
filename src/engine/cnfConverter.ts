import type { Grammar, ProductionRule, SubStep } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deep-clone a grammar so mutations don't leak. */
function cloneGrammar(g: Grammar): Grammar {
  return {
    variables: [...g.variables],
    terminals: [...g.terminals],
    rules: g.rules.map((r) => ({ lhs: r.lhs, rhs: [...r.rhs] })),
    startVariable: g.startVariable,
  };
}

/** Check structural equality of two production rules. */
function rulesEqual(a: ProductionRule, b: ProductionRule): boolean {
  return a.lhs === b.lhs && a.rhs.length === b.rhs.length && a.rhs.every((s, i) => s === b.rhs[i]);
}

/** Check if a rule already exists in a list. */
function ruleExists(rules: ProductionRule[], rule: ProductionRule): boolean {
  return rules.some((r) => rulesEqual(r, rule));
}

/** Generate a fresh variable name not in the existing set. */
function freshVariable(existing: string[]): string {
  const set = new Set(existing);
  // Try single uppercase letters first
  for (let c = 65; c <= 90; c++) {
    const name = String.fromCharCode(c);
    if (!set.has(name)) return name;
  }
  // Fall back to letter + number
  for (let c = 65; c <= 90; c++) {
    for (let n = 1; n <= 100; n++) {
      const name = `${String.fromCharCode(c)}${n}`;
      if (!set.has(name)) return name;
    }
  }
  return 'Z999';
}

/** Format a rule as "A → w" for display. */
function formatRule(rule: ProductionRule): string {
  const rhs = rule.rhs.length === 0 ? 'ε' : rule.rhs.join('');
  return `${rule.lhs} → ${rhs}`;
}

// ─── Validation ─────────────────────────────────────────────────────────────

/** Validates a grammar has at least one rule and consistent symbols. */
export function validateGrammar(grammar: Grammar): { valid: boolean; error?: string } {
  if (grammar.rules.length === 0) {
    return { valid: false, error: 'At least one production rule is required' };
  }

  const allSymbols = new Set([...grammar.variables, ...grammar.terminals]);

  for (const rule of grammar.rules) {
    if (!grammar.variables.includes(rule.lhs)) {
      return { valid: false, error: `LHS variable "${rule.lhs}" is not defined in variables` };
    }
    for (const sym of rule.rhs) {
      if (!allSymbols.has(sym)) {
        return { valid: false, error: `Symbol "${sym}" in rule ${formatRule(rule)} is not defined in variables or terminals` };
      }
    }
  }

  return { valid: true };
}

// ─── Step 1: Add New Start Variable ─────────────────────────────────────────

/** Step 1: adds a new start variable S1 → S and updates the start variable. */
export function addNewStartVariable(grammar: Grammar): SubStep[] {
  const g = cloneGrammar(grammar);

  // Find a name for the new start variable: S1, S2, S3, ...
  let newStart = 'S1';
  let counter = 1;
  while (g.variables.includes(newStart)) {
    counter++;
    newStart = `S${counter}`;
  }

  const newRule: ProductionRule = { lhs: newStart, rhs: [g.startVariable] };

  g.variables = [newStart, ...g.variables];
  g.rules = [newRule, ...g.rules];
  g.startVariable = newStart;

  const step: SubStep = {
    stepNumber: 1,
    stepLabel: 'Add new start variable',
    removedRules: [],
    addedRules: [newRule],
    grammarAfter: g,
    annotation: '',
  };
  step.annotation = generateSubStepAnnotation(step);

  return [step];
}

// ─── Step 2: Eliminate ε-rules ──────────────────────────────────────────────

/** Compute the set of nullable variables (those that can derive ε). */
function computeNullable(grammar: Grammar): Set<string> {
  const nullable = new Set<string>();

  // Direct: A → ε
  for (const rule of grammar.rules) {
    if (rule.rhs.length === 0) {
      nullable.add(rule.lhs);
    }
  }

  // Indirect: A → B1B2...Bn where all Bi are nullable
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of grammar.rules) {
      if (!nullable.has(rule.lhs) && rule.rhs.length > 0 && rule.rhs.every((s) => nullable.has(s))) {
        nullable.add(rule.lhs);
        changed = true;
      }
    }
  }

  return nullable;
}

/** Step 2: eliminates ε-rules one at a time. */
export function eliminateEpsilonRules(grammar: Grammar): SubStep[] {
  let g = cloneGrammar(grammar);
  const steps: SubStep[] = [];
  const nullable = computeNullable(g);

  // Process each ε-rule one at a time
  while (true) {
    // Find an ε-rule where lhs is not the start variable
    const epsilonIdx = g.rules.findIndex(
      (r) => r.rhs.length === 0 && r.lhs !== g.startVariable,
    );
    if (epsilonIdx === -1) break;

    const epsilonRule = g.rules[epsilonIdx];
    const nullableVar = epsilonRule.lhs;

    const removed: ProductionRule[] = [{ lhs: epsilonRule.lhs, rhs: [...epsilonRule.rhs] }];
    const added: ProductionRule[] = [];

    // Remove the ε-rule
    const newRules = g.rules.filter((_, i) => i !== epsilonIdx);

    // For each rule containing the nullable variable on RHS, add combinations
    const rulesToAdd: ProductionRule[] = [];
    for (const rule of g.rules) {
      if (rule.rhs.includes(nullableVar)) {
        const combos = generateCombinationsForVar(rule.rhs, nullableVar);
        for (const combo of combos) {
          const newRule: ProductionRule = { lhs: rule.lhs, rhs: combo };
          // Don't add ε-productions for non-start variables
          if (newRule.rhs.length === 0 && newRule.lhs !== g.startVariable) continue;
          // Don't add duplicates
          if (!ruleExists(newRules, newRule) && !ruleExists(rulesToAdd, newRule)) {
            rulesToAdd.push(newRule);
            added.push({ lhs: newRule.lhs, rhs: [...newRule.rhs] });
          }
        }
      }
    }

    const afterRules = [...newRules, ...rulesToAdd];
    const afterGrammar: Grammar = {
      ...g,
      rules: afterRules,
    };

    const step: SubStep = {
      stepNumber: 2,
      stepLabel: 'Eliminate ε-rules',
      removedRules: removed,
      addedRules: added,
      grammarAfter: cloneGrammar(afterGrammar),
      annotation: '',
    };
    step.annotation = generateSubStepAnnotation(step);
    steps.push(step);

    g = cloneGrammar(afterGrammar);
  }

  // If the start variable was nullable in the original grammar, ensure S1 → ε exists
  if (nullable.has(grammar.startVariable)) {
    const startEpsilon: ProductionRule = { lhs: g.startVariable, rhs: [] };
    if (!ruleExists(g.rules, startEpsilon)) {
      g.rules.push(startEpsilon);
      const step: SubStep = {
        stepNumber: 2,
        stepLabel: 'Eliminate ε-rules',
        removedRules: [],
        addedRules: [startEpsilon],
        grammarAfter: cloneGrammar(g),
        annotation: '',
      };
      step.annotation = generateSubStepAnnotation(step);
      steps.push(step);
    }
  }

  return steps;
}

/**
 * Generate all combinations of removing a specific variable from a RHS.
 * Returns combinations where at least one occurrence is removed.
 */
function generateCombinationsForVar(rhs: string[], variable: string): string[][] {
  // Find indices where the variable appears
  const indices: number[] = [];
  for (let i = 0; i < rhs.length; i++) {
    if (rhs[i] === variable) {
      indices.push(i);
    }
  }

  if (indices.length === 0) return [];

  const results: string[][] = [];
  // Generate all non-empty subsets of indices to remove
  const totalSubsets = 1 << indices.length;
  for (let mask = 1; mask < totalSubsets; mask++) {
    const indicesToRemove = new Set<number>();
    for (let bit = 0; bit < indices.length; bit++) {
      if (mask & (1 << bit)) {
        indicesToRemove.add(indices[bit]);
      }
    }
    const newRhs = rhs.filter((_, idx) => !indicesToRemove.has(idx));
    results.push(newRhs);
  }

  return results;
}

// ─── Step 3: Eliminate Unit Rules ───────────────────────────────────────────

/** Step 3: eliminates unit rules A → B one at a time. */
export function eliminateUnitRules(grammar: Grammar): SubStep[] {
  let g = cloneGrammar(grammar);
  const steps: SubStep[] = [];
  const variableSet = new Set(g.variables);

  while (true) {
    // Find a unit rule: A → B where B is a single variable
    const unitIdx = g.rules.findIndex(
      (r) => r.rhs.length === 1 && variableSet.has(r.rhs[0]),
    );
    if (unitIdx === -1) break;

    const unitRule = g.rules[unitIdx];
    const A = unitRule.lhs;
    const B = unitRule.rhs[0];

    const removed: ProductionRule[] = [{ lhs: A, rhs: [B] }];
    const added: ProductionRule[] = [];

    // Remove the unit rule
    const newRules = g.rules.filter((_, i) => i !== unitIdx);

    // For each rule B → u, add A → u (if not already present and not a unit rule back to A)
    const rulesToAdd: ProductionRule[] = [];
    for (const rule of g.rules) {
      if (rule.lhs === B && !rulesEqual(rule, unitRule)) {
        const newRule: ProductionRule = { lhs: A, rhs: [...rule.rhs] };
        // Don't add if it's the same unit rule we just removed or already exists
        if (!ruleExists(newRules, newRule) && !ruleExists(rulesToAdd, newRule)) {
          rulesToAdd.push(newRule);
          added.push({ lhs: newRule.lhs, rhs: [...newRule.rhs] });
        }
      }
    }

    const afterRules = [...newRules, ...rulesToAdd];
    const afterGrammar: Grammar = {
      ...g,
      rules: afterRules,
      variables: [...g.variables],
      terminals: [...g.terminals],
    };

    const step: SubStep = {
      stepNumber: 3,
      stepLabel: 'Eliminate unit-rules',
      removedRules: removed,
      addedRules: added,
      grammarAfter: cloneGrammar(afterGrammar),
      annotation: '',
    };
    step.annotation = generateSubStepAnnotation(step);
    steps.push(step);

    g = cloneGrammar(afterGrammar);
    // Update variable set in case variables changed (shouldn't, but be safe)
    variableSet.clear();
    g.variables.forEach((v) => variableSet.add(v));
  }

  return steps;
}

// ─── Step 4: Break Long Rules ───────────────────────────────────────────────

/** Step 4: breaks rules with >2 RHS symbols into binary rules. */
export function breakLongRules(grammar: Grammar): SubStep[] {
  let g = cloneGrammar(grammar);
  const steps: SubStep[] = [];

  while (true) {
    // Find a rule with more than 2 RHS symbols
    const longIdx = g.rules.findIndex((r) => r.rhs.length > 2);
    if (longIdx === -1) break;

    const longRule = g.rules[longIdx];
    const removed: ProductionRule[] = [{ lhs: longRule.lhs, rhs: [...longRule.rhs] }];
    const added: ProductionRule[] = [];

    // Break A → B1 B2 ... Bn into:
    // A → B1 C1, C1 → B2 C2, ..., C(n-2) → B(n-1) Bn
    const symbols = longRule.rhs;
    const newRules: ProductionRule[] = [];
    const newVars: string[] = [];

    let currentLhs = longRule.lhs;
    for (let i = 0; i < symbols.length - 2; i++) {
      const newVar = freshVariable([...g.variables, ...newVars]);
      newVars.push(newVar);

      const rule: ProductionRule = { lhs: currentLhs, rhs: [symbols[i], newVar] };
      newRules.push(rule);
      added.push({ lhs: rule.lhs, rhs: [...rule.rhs] });

      currentLhs = newVar;
    }
    // Last rule: C(n-2) → B(n-1) Bn
    const lastRule: ProductionRule = {
      lhs: currentLhs,
      rhs: [symbols[symbols.length - 2], symbols[symbols.length - 1]],
    };
    newRules.push(lastRule);
    added.push({ lhs: lastRule.lhs, rhs: [...lastRule.rhs] });

    // Replace the long rule with the new binary rules
    const afterRules = [...g.rules.filter((_, i) => i !== longIdx), ...newRules];
    const afterGrammar: Grammar = {
      variables: [...g.variables, ...newVars],
      terminals: [...g.terminals],
      rules: afterRules,
      startVariable: g.startVariable,
    };

    const step: SubStep = {
      stepNumber: 4,
      stepLabel: 'Break long rules',
      removedRules: removed,
      addedRules: added,
      grammarAfter: cloneGrammar(afterGrammar),
      annotation: '',
    };
    step.annotation = generateSubStepAnnotation(step);
    steps.push(step);

    g = cloneGrammar(afterGrammar);
  }

  return steps;
}

// ─── Step 5: Replace Mixed Terminals ────────────────────────────────────────

/** Step 5: replaces mixed terminal/variable rules with terminal-wrapping variables. */
export function replaceMixedTerminals(grammar: Grammar): SubStep[] {
  let g = cloneGrammar(grammar);
  const steps: SubStep[] = [];
  const terminalSet = new Set(g.terminals);

  // Map from terminal to its wrapper variable (reused across rules)
  const terminalVarMap = new Map<string, string>();

  while (true) {
    // Find a rule A → u1 u2 where rhs.length === 2 and at least one is a terminal
    const mixedIdx = g.rules.findIndex(
      (r) =>
        r.rhs.length === 2 &&
        (terminalSet.has(r.rhs[0]) || terminalSet.has(r.rhs[1])),
    );
    if (mixedIdx === -1) break;

    const mixedRule = g.rules[mixedIdx];
    const removed: ProductionRule[] = [{ lhs: mixedRule.lhs, rhs: [...mixedRule.rhs] }];
    const added: ProductionRule[] = [];
    const newVars: string[] = [];
    const newWrapperRules: ProductionRule[] = [];

    // Replace each terminal in the RHS with a wrapper variable
    const newRhs = mixedRule.rhs.map((sym) => {
      if (terminalSet.has(sym)) {
        if (!terminalVarMap.has(sym)) {
          const wrapperVar = freshVariable([...g.variables, ...newVars]);
          newVars.push(wrapperVar);
          terminalVarMap.set(sym, wrapperVar);
          const wrapperRule: ProductionRule = { lhs: wrapperVar, rhs: [sym] };
          newWrapperRules.push(wrapperRule);
          added.push({ lhs: wrapperRule.lhs, rhs: [...wrapperRule.rhs] });
        }
        return terminalVarMap.get(sym)!;
      }
      return sym;
    });

    const replacedRule: ProductionRule = { lhs: mixedRule.lhs, rhs: newRhs };
    added.push({ lhs: replacedRule.lhs, rhs: [...replacedRule.rhs] });

    // Replace the mixed rule and add wrapper rules
    const afterRules = [
      ...g.rules.filter((_, i) => i !== mixedIdx),
      replacedRule,
      ...newWrapperRules,
    ];
    const afterGrammar: Grammar = {
      variables: [...g.variables, ...newVars],
      terminals: [...g.terminals],
      rules: afterRules,
      startVariable: g.startVariable,
    };

    const step: SubStep = {
      stepNumber: 5,
      stepLabel: 'Replace mixed terminals',
      removedRules: removed,
      addedRules: added,
      grammarAfter: cloneGrammar(afterGrammar),
      annotation: '',
    };
    step.annotation = generateSubStepAnnotation(step);
    steps.push(step);

    g = cloneGrammar(afterGrammar);
  }

  return steps;
}

// ─── Annotation Generator ───────────────────────────────────────────────────

/** Produces educational annotation text for a sub-step. */
export function generateSubStepAnnotation(step: SubStep): string {
  const { stepNumber, removedRules, addedRules } = step;

  switch (stepNumber) {
    case 1: {
      const newStart = addedRules[0];
      return `Step 1 — Add new start variable: Added rule ${formatRule(newStart)} and set ${newStart.lhs} as the new start variable. This ensures the start variable does not appear on the right-hand side of any rule.`;
    }
    case 2: {
      if (removedRules.length === 0 && addedRules.length > 0) {
        // Adding S1 → ε because original start was nullable
        return `Step 2 — Eliminate ε-rules: Added ${formatRule(addedRules[0])} because the original start variable was nullable (the language includes the empty string).`;
      }
      const removed = removedRules[0];
      const addedStr =
        addedRules.length > 0
          ? ` Added ${addedRules.map(formatRule).join(', ')} to account for occurrences of ${removed.lhs} on the right-hand side of other rules.`
          : '';
      return `Step 2 — Eliminate ε-rules: Removed ${formatRule(removed)}.${addedStr}`;
    }
    case 3: {
      const removed = removedRules[0];
      const B = removed.rhs[0];
      const addedStr =
        addedRules.length > 0
          ? ` Replaced with ${addedRules.map(formatRule).join(', ')} from the rules for ${B}.`
          : ` No non-unit rules found for ${B} to substitute.`;
      return `Step 3 — Eliminate unit-rules: Removed unit rule ${formatRule(removed)}.${addedStr}`;
    }
    case 4: {
      const removed = removedRules[0];
      const addedStr = addedRules.map(formatRule).join(', ');
      return `Step 4 — Break long rules: Broke ${formatRule(removed)} into binary rules: ${addedStr}.`;
    }
    case 5: {
      const removed = removedRules[0];
      const addedStr = addedRules.map(formatRule).join(', ');
      return `Step 5 — Replace mixed terminals: Replaced ${formatRule(removed)} with ${addedStr} using terminal-wrapping variables.`;
    }
    default:
      return `Step ${stepNumber}: Transformation applied.`;
  }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

/** Converts a grammar to CNF, returning all sub-steps. Throws if the grammar is invalid. */
export function convertToCnf(grammar: Grammar): SubStep[] {
  const validation = validateGrammar(grammar);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let current = cloneGrammar(grammar);
  const allSteps: SubStep[] = [];

  for (const stepFn of [
    addNewStartVariable,
    eliminateEpsilonRules,
    eliminateUnitRules,
    breakLongRules,
    replaceMixedTerminals,
  ]) {
    const steps = stepFn(current);
    allSteps.push(...steps);
    if (steps.length > 0) {
      current = cloneGrammar(steps[steps.length - 1].grammarAfter);
    }
  }

  return allSteps;
}
