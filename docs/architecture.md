# Architecture

## Overview

The PDA Interactive Dashboard is a multi-page React + TypeScript application that visualizes Pushdown Automata. It uses client-side routing (React Router v7) with a collapsible sidebar for navigation. The architecture follows a layered approach with clear separation between the simulation engine (pure logic, no React) and the UI layer.

## Tech Stack

- React 19 + TypeScript 6
- React Router 7 (library/declarative mode — BrowserRouter, Routes, NavLink)
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
├── pages/          # Route-level page components
│   ├── HomePage.tsx      # Landing page
│   ├── HomePage.css
│   └── PdaPage.tsx       # PDA dashboard (wraps SimulatorProvider)
├── components/     # React UI components (each with .tsx, .css, .test.tsx)
│   ├── AppLayout.tsx     # Layout shell (sidebar + outlet)
│   ├── AppLayout.css
│   ├── Sidebar.tsx       # Collapsible navigation sidebar
│   ├── Sidebar.css
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
├── App.css         # Dashboard grid layout styles
├── main.tsx        # Entry point (BrowserRouter + route config)
└── index.css       # Global styles + CSS variables
```

## Routing

The app uses React Router v7 in library mode (no framework features, no SSR).

```
main.tsx → BrowserRouter → Routes → AppLayout (Sidebar + Outlet)
                                        ├── "/" → HomePage
                                        └── "/pda" → PdaPage → SimulatorProvider → PdaDashboard
                                        └── "*" → Redirect to "/"
```

### Route Configuration

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Landing page |
| `/pda` | `PdaPage` | PDA visualization dashboard |
| `*` | `<Navigate to="/" />` | Catch-all redirect |

All routes are children of a pathless layout route rendering `AppLayout`.

### Sidebar

The sidebar is a collapsible navigation panel (`src/components/Sidebar.tsx`) with:
- SVG icons for each nav item
- `NavLink` with active state styling
- Local `useState` for collapse toggle (no global state needed)
- CSS transitions for smooth expand/collapse animation
- Toggle button at the top with chevron SVG

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

The `SimulatorProvider` is scoped to `PdaPage` only — simulator state is created when navigating to `/pda` and destroyed when navigating away.

## Layer Boundaries

- **types/** — Shared interfaces. No imports from other src/ directories.
- **data/** — Imports only from types/. Static PDA definitions.
- **engine/** — Imports only from types/. Pure functions, fully testable without React.
- **context/** — Imports from types/, data/, engine/. The reducer is the only place that calls engine functions.
- **pages/** — Route-level components. `PdaPage` wraps `SimulatorProvider` and renders the dashboard.
- **components/** — Import from types/, context/, engine/ (only for `formatTransitionRule` and `generateAnnotation`). Each component is a presentational function component with props.
- **main.tsx** — Entry point. Configures BrowserRouter and route tree.
