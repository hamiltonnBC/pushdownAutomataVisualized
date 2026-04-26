# Testing

## Setup

- **Framework**: Vitest 4 with jsdom environment
- **Component testing**: React Testing Library
- **Property-based testing**: fast-check (available, used in optional tests)
- **Config**: `vite.config.ts` → `test` section
- **Setup file**: `src/test-setup.ts` (imports `@testing-library/jest-dom`)

## Commands

```bash
npm test          # Run all tests once (vitest --run)
npm run test:watch  # Watch mode (vitest)
```

## Test Files

| File | What it tests | Count |
|---|---|---|
| `src/types/pda.test.ts` | Type definitions compile and instantiate correctly | 9 |
| `src/engine/simulator.test.ts` | All engine functions (createInitialState, getApplicableTransitions, applyTransition, isTerminal, isAccepted, validateInput, detectLoop, generateAnnotation) | ~65 |
| `src/engine/bInMiddle-playthrough.test.ts` | End-to-end simulation of every b-in-middle predefined input + accepting path verification | ~10 |
| `src/context/SimulatorContext.test.tsx` | Reducer actions, nondeterministic branching, full simulation flows, context hook | ~40 |
| `src/components/*.test.tsx` | Component rendering, props, interactions, accessibility | ~130 |

Total: ~261 tests across 16 files.

## Testing Patterns

### Engine tests
Pure function tests — no React, no DOM. Call the function, assert the output.

### Reducer tests
Import `simulatorReducer` directly, create state with `createInitialState`, dispatch actions, assert new state.

### Component tests
Render with React Testing Library, query by role/text/label, assert DOM state. Components that need context (like ControlBar) are wrapped in `<SimulatorProvider>`.

### Nondeterministic simulation tests
For the b-in-middle PDA, tests use `transitionIndex` in the STEP_FORWARD payload to explicitly choose branches, verifying both the accepting and rejecting paths.

## Key Test Scenarios

- Deterministic PDAs step through to acceptance/rejection correctly
- Nondeterministic choice points create branches and set status to `'branching'`
- SELECT_BRANCH loads the correct state and allows continued stepping
- Loop detection catches stuck configurations
- Input validation rejects invalid symbols
- Step backward restores previous configuration
- Reset returns to initial state
