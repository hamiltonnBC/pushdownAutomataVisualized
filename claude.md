# PDA Interactive Dashboard — AI Context

This is a React + TypeScript application that visualizes Pushdown Automata (PDA) from a theory of computation textbook. It provides step-by-step simulation with animated tape, stack, and state displays. The app uses client-side routing with a collapsible sidebar for navigation between pages.

## Quick Reference

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Tests**: `npm test` (265 tests, all should pass)
- **Type check**: `npx tsc --noEmit`

## Documentation

Read these docs for full details on each part of the system:

- `docs/architecture.md` — Project structure, tech stack, routing, data flow, layer boundaries
- `docs/data-model.md` — All TypeScript interfaces (PDADefinition, SimulatorState, Transition, etc.), status values, stack replacement rules
- `docs/engine.md` — Pure simulation functions (createInitialState, applyTransition, detectLoop, etc.), acceptance condition, loop detection
- `docs/state-management.md` — React Context + useReducer, all actions (STEP_FORWARD, SELECT_BRANCH, etc.), nondeterministic branching flow
- `docs/components.md` — Every UI component with props, behavior, and layout grid
- `docs/pda-examples.md` — The three PDA examples, how they work, how to add new ones
- `docs/testing.md` — Test setup, commands, patterns, key scenarios

## Routing & Pages

The app uses React Router v7 (library/declarative mode) with `BrowserRouter`.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Landing page with "Theory of Computation Interactive Guide" heading |
| `/pda` | `PdaPage` | PDA visualization dashboard (all simulation components) |
| `*` | Redirect to `/` | Catch-all for undefined paths |

All routes are children of a pathless layout route that renders `AppLayout` (sidebar + outlet).

### Key routing files

| File | Purpose |
|------|---------|
| `src/main.tsx` | BrowserRouter + Routes configuration |
| `src/components/AppLayout.tsx` | Layout shell (sidebar + content outlet) |
| `src/components/Sidebar.tsx` | Collapsible nav with SVG icons |
| `src/pages/HomePage.tsx` | Home page |
| `src/pages/PdaPage.tsx` | PDA dashboard (wraps SimulatorProvider) |

## Critical Concepts

### Stack Replacement
The `stackReplacement` array in a Transition determines what happens to the stack top:
- `[]` = pop (remove top)
- `['A']` where A = stackTop = keep (no change)
- `['A', 'S']` where A = stackTop = push S on top
- Internally: always pop first, then push all replacement symbols in order

### Nondeterministic Branching
When a nondeterministic PDA has multiple matching transitions and no `transitionIndex` is specified:
1. Reducer creates `ComputationBranch` objects for each option
2. Sets `status: 'branching'` — simulation pauses
3. Step Forward is disabled
4. User must click a branch in the BranchView panel
5. `SELECT_BRANCH` loads that branch and sets `status: 'running'`

This is the trickiest part of the codebase. If you change branching logic, test with the b-in-middle PDA using inputs like "aba", "b", and "aabba".

### Acceptance Condition
Accept by empty stack: stack must be completely empty (including $) AND head must be at `inputString.length` (on the blank cell past the last input symbol).

### Transition Notation
Textbook format: `raA → r'ℓw` where r=state, a=tape symbol, A=stack top, r'=new state, ℓ=head direction (R/N), w=stack replacement. In code this maps to the `Transition` interface fields.

## Key Files

| File | Purpose |
|------|---------|
| `src/types/pda.ts` | All type definitions |
| `src/engine/simulator.ts` | Pure simulation logic (no React) |
| `src/context/SimulatorContext.tsx` | Reducer + Context + useSimulator hook |
| `src/data/bInMiddle.ts` | Nondeterministic PDA (most complex example) |
| `src/main.tsx` | Entry point, router configuration |
| `src/pages/PdaPage.tsx` | PDA dashboard layout, wires context to components |
| `src/components/ControlBar.tsx` | Composes controls, dispatches actions |
| `src/components/Sidebar.tsx` | Collapsible sidebar navigation |

## Common Tasks

### Adding a new PDA example
See `docs/pda-examples.md` → "Adding a New PDA Example"

### Modifying simulation logic
Edit `src/engine/simulator.ts` (pure functions) and/or `src/context/SimulatorContext.tsx` (reducer). Run `npm test` to verify.

### Adding a new component
Create `.tsx`, `.css`, `.test.tsx` in `src/components/`. Follow BEM CSS naming. Add to the grid in `src/pages/PdaPage.tsx` and `src/App.css`.

### Adding a new page/route
1. Create `src/pages/NewPage.tsx` (and `.css` if needed)
2. Add a `<Route>` in `src/main.tsx` inside the layout route
3. Add a `NavLink` in `src/components/Sidebar.tsx`

### Debugging nondeterministic behavior
The b-in-middle PDA is the only nondeterministic example. Check `src/engine/bInMiddle-playthrough.test.ts` for end-to-end simulation tests. The key transitions to watch are the ones where `fromState: 'q'` and `tapeSymbol: 'b'` — these are the nondeterministic choice points.
