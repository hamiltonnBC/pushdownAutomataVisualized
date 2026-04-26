# Architecture

## Overview

The PDA Interactive Dashboard is a single-page React + TypeScript application that visualizes Pushdown Automata. It follows a layered architecture with a clear separation between the simulation engine (pure logic, no React) and the UI layer.

## Tech Stack

- React 19 + TypeScript 6
- Vite 8 (build + dev server)
- Vitest 4 (testing, jsdom environment)
- React Testing Library (component tests)
- fast-check (property-based testing, available but optional tests)
- Plain CSS with BEM naming (no CSS framework)
- React Context + useReducer (state management, no external library)

## Directory Structure

```
src/
├── types/          # TypeScript interfaces (PDADefinition, SimulatorState, etc.)
│   ├── pda.ts      # All type definitions
│   └── index.ts    # Barrel export
├── data/           # PDA example definitions (static data)
│   ├── nestedParentheses.ts
│   ├── zeroNOneN.ts
│   ├── bInMiddle.ts
│   └── index.ts    # Barrel export + allExamples array
├── engine/         # Pure simulation logic (no React dependency)
│   └── simulator.ts
├── context/        # React state management
│   └── SimulatorContext.tsx
├── components/     # React UI components (each with .tsx, .css, .test.tsx)
│   ├── TapeDisplay
│   ├── StackDisplay
│   ├── StateControlDisplay
│   ├── TransitionTable
│   ├── AnnotationPanel
│   ├── BranchExplainer
│   ├── ComputationHistory
│   ├── BranchView
│   ├── FormalDefinitionDisplay
│   ├── ExampleSelector
│   ├── StringInput
│   ├── StepController
│   └── ControlBar
├── App.tsx         # Root layout (CSS Grid)
├── App.css         # Grid layout styles
├── main.tsx        # Entry point (wraps App in SimulatorProvider)
└── index.css       # Global styles + CSS variables
```

## Data Flow

```
User Action → ControlBar dispatches SimulatorAction
                    ↓
            simulatorReducer (in SimulatorContext)
                    ↓
            calls engine functions (simulator.ts)
                    ↓
            returns new SimulatorState
                    ↓
            React re-renders all components via context
```

All state lives in a single `SimulatorState` object managed by `useReducer`. Components read from context via the `useSimulator()` hook. The engine functions are pure — they take state in and return new state out, with no side effects.

## Layer Boundaries

- **types/** — Shared interfaces. No imports from other src/ directories.
- **data/** — Imports only from types/. Static PDA definitions.
- **engine/** — Imports only from types/. Pure functions, fully testable without React.
- **context/** — Imports from types/, data/, engine/. The reducer is the only place that calls engine functions.
- **components/** — Import from types/, context/, engine/ (only for `formatTransitionRule` and `generateAnnotation`). Each component is a presentational function component with props.
- **App.tsx** — Imports everything, wires context state to component props.
