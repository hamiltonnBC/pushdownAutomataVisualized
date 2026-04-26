# Simulation Engine

All engine functions live in `src/engine/simulator.ts`. They are pure functions with no React dependency — they take data in and return data out.

## Functions

### `createInitialState(definition, inputString) → SimulatorState`

Sets up a fresh simulation:
- `tape` = input characters split into array + `'□'` at the end
- `headPosition` = 0
- `stack` = `['$']`
- `currentState` = definition's `startState`
- `status` = `'ready'`
- `history` = `[]`, `branches` = `[]`

### `getApplicableTransitions(definition, state, tapeSymbol, stackTop) → Transition[]`

Filters the PDA's transition list to find all rules matching the given (state, tapeSymbol, stackTop) triple. Returns 0, 1, or multiple matches.

- 0 matches → no valid transition (rejection)
- 1 match → deterministic step
- 2+ matches → nondeterministic choice point

### `applyTransition(state, transition) → SimulatorState`

Applies one transition rule to produce a new state:

1. Pops the stack top (removes last element)
2. Pushes all `stackReplacement` symbols in order (last becomes new top)
3. Moves head: `'R'` → headPosition + 1, `'N'` → unchanged
4. Updates `currentState` to `transition.toState`
5. Records a `SimulatorSnapshot` in `history`
6. Sets `status` to `'running'`

This function does NOT check terminal conditions — that's the reducer's job.

### `isTerminal(state) → boolean`

Returns `true` when `stack.length === 0` (the `$` was popped).

### `isAccepted(state) → boolean`

Returns `true` when stack is empty AND `headPosition === inputString.length` (head is on the blank cell past the last input symbol).

### `detectLoop(state) → boolean`

Compares the current configuration (currentState, headPosition, stack) against all previous snapshots in history (excluding the last one, which represents the current config). Returns `true` if any match is found — this means the PDA is stuck repeating the same configuration.

### `validateInput(input, tapeAlphabet) → { valid, invalidSymbols }`

Checks every character in the input string against the tape alphabet. Returns `valid: true` if all characters are in the alphabet, otherwise returns the set of invalid symbols.

### `generateAnnotation(state, transition) → string`

Produces human-readable text for the current step:
- **Ready state** (transition=null): describes initial setup
- **Mid-computation** (transition provided): formal notation `raA → r'ℓw` + stack operation description
- **Accepted**: explains acceptance condition
- **Rejected/Looping**: explains why
- **Branching**: prompts user to pick a branch

## Acceptance Condition

The PDA accepts by empty stack: the input is accepted when the stack becomes completely empty (including `$`) AND the tape head has moved past the last input symbol onto the blank cell. This matches the textbook definition.

## Loop Detection

A loop is detected when the current (state, headPosition, stack) triple matches any previous snapshot. This catches transitions with `headDirection: 'N'` and `stackReplacement` equal to `[stackTop]` — the configuration never changes, so the PDA is stuck.
