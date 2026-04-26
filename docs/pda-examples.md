# PDA Examples

The three PDA examples are based on a theory of computation textbook. Each is defined in `src/data/` as a `PDADefinition` object.

## 1. Properly Nested Parentheses

**File:** `src/data/nestedParentheses.ts`

Accepts strings of properly nested parentheses, using `a` for `(` and `b` for `)`.

- **Σ** = {a, b}
- **Γ** = {$, S}
- **Q** = {q} (single state)
- **Deterministic**: yes
- **6 transitions**

How it works: each `a` pushes an `S` onto the stack. Each `b` pops an `S`. At end of input, if only `$` remains, the parentheses were balanced → accept. If `S` remains, there are unmatched opens → loop. If `b` is read with `$` on top, there are too many closes → the stack empties prematurely.

**Predefined inputs:** `aabb` (accept), `abab` (accept), `aab` (reject), `ba` (reject), ε (accept)

## 2. Strings of the form 0ⁿ1ⁿ

**File:** `src/data/zeroNOneN.ts`

Accepts strings with equal numbers of 0s followed by 1s.

- **Σ** = {0, 1}
- **Γ** = {$, S}
- **Q** = {q0, q1} (two states)
- **Deterministic**: yes
- **12 transitions**

How it works: in state `q0`, each `0` pushes an `S`. When the first `1` is read, switch to `q1` and pop an `S`. In `q1`, each `1` pops an `S`. At end of input, if only `$` remains → accept. Various rejection cases handle `1` before any `0`, `0` after `1`s, and unequal counts.

**Predefined inputs:** `0011` (accept), `000111` (accept), `01` (accept), `0110` (reject), `0001` (reject), ε (accept)

## 3. Strings with b in the middle (Nondeterministic)

**File:** `src/data/bInMiddle.ts`

Accepts odd-length strings in {a,b}* whose middle symbol is b. This is the only nondeterministic PDA.

- **Σ** = {a, b}
- **Γ** = {$, S}
- **Q** = {q, q2} (two states)
- **Nondeterministic**: yes
- **14 transitions**

How it works: the PDA can't see ahead to know where the middle is, so it has to **guess**. In state `q`, every symbol pushes an `S` (counting symbols read). When reading a `b`, the PDA can nondeterministically choose to switch to `q2` (guessing this `b` is the middle). In `q2`, every symbol pops an `S`. If the guess was correct, the stack will be exactly empty when the input ends → accept.

The key nondeterministic transitions (when reading `b`):
- **Stay in q**: push `S`, keep reading (didn't guess middle yet)
- **Switch to q2**: keep stack unchanged, start popping (guessed this is the middle)

When the simulation hits one of these choice points, it enters `'branching'` status and the user must pick which path to follow.

**Predefined inputs:** `aba` (accept), `aabaa` (accept), `abba` (reject — even length), `bb` (reject — even length), `ab` (reject — even length), `aabba` (accept), `aaaba` (reject — middle is a)

## Adding a New PDA Example

1. Create a new file in `src/data/` (e.g., `myPda.ts`)
2. Export a `PDADefinition` object with all fields
3. Set `isNondeterministic: true` if any (state, tapeSymbol, stackTop) triple has multiple matching transitions
4. Add it to `src/data/index.ts` — both the named export and the `allExamples` array
5. The UI will automatically pick it up (ExampleSelector reads from `allExamples`)

### Transition Accuracy

When defining transitions, match the textbook notation exactly:
- `raA → r'ℓw` maps to `{ fromState: r, tapeSymbol: a, stackTop: A, toState: r', headDirection: ℓ, stackReplacement: [w] }`
- `w = ε` (empty string) means `stackReplacement: []` — this pops the top
- `w = A` (same as stackTop) means `stackReplacement: ['A']` — stack unchanged
- `w = AS` means `stackReplacement: ['A', 'S']` — pushes S on top of A
