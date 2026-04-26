# State Management

All state management lives in `src/context/SimulatorContext.tsx`.

## Architecture

The app uses React Context + `useReducer`. A single `SimulatorState` object holds everything. The reducer (`simulatorReducer`) is the only place that calls engine functions.

```
SimulatorProvider (wraps entire app in main.tsx)
  └── useReducer(simulatorReducer, initialState)
       └── SimulatorContext.Provider value={{ state, dispatch }}
            └── useSimulator() hook (used by components)
```

## Actions

| Action | Payload | Effect |
|---|---|---|
| `SELECT_EXAMPLE` | `PDADefinition` | Resets to new PDA with empty input |
| `SET_INPUT` | `string` | Validates input, resets simulator if valid |
| `STEP_FORWARD` | `{ transitionIndex?: number }` | Advances one step (see below) |
| `STEP_BACKWARD` | — | Restores previous snapshot from history |
| `RESET` | — | Resets to initial state, keeps current PDA + input |
| `SELECT_BRANCH` | `string` (branch ID) | Loads a branch's state into the main simulator |
| `RESTORE_STEP` | `number` (history index) | Jumps to a specific step in history |

## STEP_FORWARD Logic

This is the most complex action. The flow:

1. If status is terminal (`accepted`, `rejected`, `looping`) or `branching` → no-op.
2. Get applicable transitions for current (state, tapeSymbol, stackTop).
3. If 0 transitions → set status to `rejected`.
4. If nondeterministic (multiple transitions, no `transitionIndex` specified, PDA is nondeterministic):
   - Create a `ComputationBranch` for each possible transition
   - Set status to `'branching'` — simulation pauses
   - User must pick a branch via `SELECT_BRANCH` to continue
5. Otherwise (deterministic or specific `transitionIndex` provided):
   - Apply the transition
   - Check terminal conditions (isTerminal → accepted/rejected, detectLoop → looping)
   - If on an active branch, update that branch's snapshots and status

## Nondeterministic Branching

When the PDA is nondeterministic and multiple transitions match:

1. `STEP_FORWARD` creates branches and sets `status: 'branching'`
2. Step Forward button is disabled (status is terminal-like)
3. User clicks a branch in the BranchView panel
4. `SELECT_BRANCH` loads that branch's snapshot into the main state, sets `status: 'running'`
5. User can continue stepping forward from that branch
6. If another nondeterministic choice is hit, the process repeats
7. Branches accumulate — the user can switch between them at any time

Branch IDs follow the pattern `branch-{stepNumber}-{transitionIndex}`.

## STEP_BACKWARD Logic

- If history is empty → no-op
- If history has 1 entry → reset to initial state (via `createInitialState`)
- Otherwise → pop last history entry, restore previous snapshot's configuration

## Initial State

The app initializes with the Nested Parentheses PDA and an empty input string. The `useReducer` initializer calls `createInitialState(nestedParentheses, '')`.
