# Data Model

All types are defined in `src/types/pda.ts`.

## PDA Definition

A PDA is modeled as the 5-tuple M = (Σ, Γ, Q, δ, q):

```typescript
interface PDADefinition {
  name: string;
  description: string;
  tapeAlphabet: string[];        // Σ — excludes blank □
  stackAlphabet: string[];       // Γ — includes '$'
  states: string[];              // Q
  startState: string;            // q
  transitions: Transition[];     // δ
  isNondeterministic: boolean;
  predefinedInputs: PredefinedInput[];
}
```

## Transition

Each transition rule follows the textbook notation `raA → r'ℓw`:

```typescript
interface Transition {
  fromState: string;             // r  — source state
  tapeSymbol: string;            // a  — symbol being read (or '□' for blank)
  tapeSymbol: string;            // A  — symbol on top of stack
  toState: string;               // r' — destination state
  headDirection: 'R' | 'N';     // ℓ  — R = move right, N = stay
  stackReplacement: string[];    // w  — what replaces A on the stack
  explanation: string;           // human-readable description
}
```

### Stack Replacement Rules

The `stackReplacement` array determines what happens to the stack:

- `[]` (empty) — **pop**: remove the top symbol. The stack shrinks by 1.
- `['$']` or `['S']` (same as stackTop) — **keep**: stack is unchanged.
- `['$', 'S']` (stackTop + new symbols) — **push**: stackTop stays, new symbols are added on top. Last element becomes the new top.
- `['X', 'Y']` (different from stackTop) — **replace**: top symbol is swapped for the new sequence.

Internally, `applyTransition` always pops the top element first, then pushes all elements of `stackReplacement` in order. So `['$', 'S']` means: pop `$`, push `$`, push `S` → net effect is `S` added on top.

## Simulator State

The complete runtime state of the simulation:

```typescript
interface SimulatorState {
  pdaDefinition: PDADefinition;
  inputString: string;
  tape: string[];              // input chars + '□' at the end
  headPosition: number;        // index into tape
  stack: string[];             // bottom-to-top order (index 0 = bottom)
  currentState: string;
  status: 'ready' | 'running' | 'accepted' | 'rejected' | 'looping' | 'branching';
  history: SimulatorSnapshot[];
  currentStep: number;
  branches: ComputationBranch[];
  activeBranchId: string | null;
  lastAppliedTransition: Transition | null;
}
```

### Status Values

| Status | Meaning |
|---|---|
| `ready` | Initial state, no steps taken yet |
| `running` | Simulation in progress, can step forward |
| `accepted` | Stack is empty AND head is past last input symbol |
| `rejected` | Stack is empty but head not at end, or no valid transitions |
| `looping` | Configuration repeated — PDA is stuck in a loop |
| `branching` | Nondeterministic choice point — user must pick a branch |

## Simulator Snapshot

A frozen copy of the configuration at one computation step:

```typescript
interface SimulatorSnapshot {
  step: number;
  headPosition: number;
  stack: string[];
  currentState: string;
  appliedTransition: Transition | null;
  annotation: string;
}
```

## Computation Branch

Used for nondeterministic PDAs when multiple transitions apply:

```typescript
interface ComputationBranch {
  id: string;                  // e.g. "branch-2-0"
  parentId: string | null;
  snapshots: SimulatorSnapshot[];
  status: 'active' | 'accepted' | 'rejected' | 'looping';
}
```

## PDA Examples

Three examples are defined in `src/data/`:

1. **Nested Parentheses** (`nestedParentheses.ts`) — Deterministic, 1 state, 6 transitions. Accepts strings of matched `a`/`b` pairs representing `(`/`)`.
2. **0ⁿ1ⁿ** (`zeroNOneN.ts`) — Deterministic, 2 states, 12 transitions. Accepts strings with equal 0s followed by 1s.
3. **b in the middle** (`bInMiddle.ts`) — Nondeterministic, 2 states, 14 transitions. Accepts odd-length strings in {a,b}* whose middle symbol is b.
