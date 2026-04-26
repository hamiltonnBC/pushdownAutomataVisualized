# Components

All components live in `src/components/`. Each has a `.tsx`, `.css`, and `.test.tsx` file. They follow BEM CSS naming and use accessible markup (ARIA roles, labels, `aria-current`).

## Layout

**App.tsx** arranges everything in a CSS Grid with named areas:

```
┌─────────────────────────────────────────────┐
│              ControlBar (sticky)             │
├──────────────┬──────────┬───────────────────┤
│  TapeDisplay │  Stack   │ StateControl      │
│              │ Display  │   Display         │
├──────────────┴──────────┼───────────────────┤
│   TransitionTable       │ AnnotationPanel   │
├─────────────────────────┴───────────────────┤
│          BranchExplainer (NPDA only)        │
├─────────────────────────┬───────────────────┤
│  ComputationHistory     │    BranchView     │
├─────────────────────────┴───────────────────┤
│         FormalDefinitionDisplay              │
└─────────────────────────────────────────────┘
```

Responsive: 3 columns at ≥1024px, 2 columns at 768–1023px.

## Visualization Components

### TapeDisplay
- Props: `tape: string[]`, `headPosition: number`
- Renders tape as horizontal row of cells
- Active cell (head position) highlighted in blue
- CSS transitions animate head movement

### StackDisplay
- Props: `stack: string[]`, `previousStack?: string[]`, `isAnimating?: boolean`
- Renders stack vertically, top element at visual top (array is reversed for display)
- Top element highlighted in purple
- `$` at bottom gets muted styling
- Animations: push (slide in), pop (fade out), replace (flash)
- Animations computed by diffing `stack` vs `previousStack`

### StateControlDisplay
- Props: `states: string[]`, `currentState: string`, `previousState: string | null`
- Renders states as labeled circles
- Active state highlighted in green
- Enter/leave animations when state changes

### TransitionTable
- Props: `transitions: Transition[]`, `activeTransition: Transition | null`, `groupByState: boolean`
- Displays transitions in `raA → r'ℓw` format (ε for empty replacement)
- Active transition row highlighted in blue
- Groups by source state when `groupByState` is true
- Exports `formatTransitionRule()` helper (also used by ComputationHistory and BranchView)

### AnnotationPanel
- Props: `annotation: string`, `status: SimulatorState['status']`
- Displays educational text for the current step
- Green styling for accepted, red for rejected/looping, amber for branching

### BranchExplainer
- Props: `isNondeterministic: boolean`, `status: SimulatorState['status']`, `branchCount: number`
- Only renders for nondeterministic PDAs
- Explains what branches are and why they exist
- Shows amber prompt when status is `'branching'`

### ComputationHistory
- Props: `history: SimulatorSnapshot[]`, `currentStep: number`, `onRestoreStep: (index) => void`
- Scrollable list of completed steps
- Each entry: step number, transition rule, head position, stack contents
- Click to restore that step

### BranchView
- Props: `branches: ComputationBranch[]`, `activeBranchId: string | null`, `onSelectBranch: (id) => void`
- Tree of computation branches for nondeterministic PDAs
- Color-coded: green=accepted, red=rejected, amber=looping, blue=selected
- Click to switch to that branch's computation

### FormalDefinitionDisplay
- Props: `definition: PDADefinition`
- Renders M = (Σ, Γ, Q, δ, q) with Unicode Greek letters
- Uses `<dl>` for semantic markup

## Control Components

### ExampleSelector
- Props: `examples: PDADefinition[]`, `currentExample: PDADefinition`, `onSelect: (example) => void`
- Radio button group for the three PDA examples

### StringInput
- Props: `tapeAlphabet: string[]`, `predefinedInputs: PredefinedInput[]`, `onSubmit: (input) => void`
- Text input with validation against tape alphabet
- Shows error with invalid symbols
- Predefined string buttons with expected result labels

### StepController
- Props: `status`, `currentStep`, `onStepForward`, `onStepBackward`, `onReset`, `playDelay?`
- Step Forward, Step Backward, Reset, Play/Pause buttons
- Play uses `setInterval` (default 1000ms)
- Disables Step Forward when status is terminal or branching
- Auto-pauses when terminal state is reached

### ControlBar
- Composes ExampleSelector + StringInput + StepController
- Uses `useSimulator()` hook to wire dispatch
- Sticky at top of page
