import { useMemo } from 'react';
import type { Transition } from '../types/pda';
import './TransitionTable.css';

export interface TransitionTableProps {
  /** All transition rules for the current PDA */
  transitions: Transition[];
  /** The transition applied in the current step, or null */
  activeTransition: Transition | null;
  /** Whether to group transitions by source state */
  groupByState: boolean;
}

/**
 * Formats a stack replacement array into the `w` portion of `raA → r'ℓw`.
 * An empty replacement (pop) is rendered as ε.
 */
function formatStackReplacement(replacement: string[]): string {
  return replacement.length === 0 ? 'ε' : replacement.join('');
}

/**
 * Formats a single transition in `raA → r'ℓw` notation.
 */
export function formatTransitionRule(t: Transition): string {
  const left = `${t.fromState}${t.tapeSymbol}${t.stackTop}`;
  const right = `${t.toState}${t.headDirection}${formatStackReplacement(t.stackReplacement)}`;
  return `${left} → ${right}`;
}

/**
 * Checks whether two transitions are the same rule by comparing all fields
 * (excluding explanation, which is display-only metadata).
 */
function transitionsMatch(a: Transition, b: Transition): boolean {
  return (
    a.fromState === b.fromState &&
    a.tapeSymbol === b.tapeSymbol &&
    a.stackTop === b.stackTop &&
    a.toState === b.toState &&
    a.headDirection === b.headDirection &&
    a.stackReplacement.length === b.stackReplacement.length &&
    a.stackReplacement.every((s, i) => s === b.stackReplacement[i])
  );
}

interface TransitionGroup {
  state: string;
  transitions: Transition[];
}

/**
 * Renders a single transition row.
 */
function TransitionRow({
  transition,
  isActive,
}: {
  transition: Transition;
  isActive: boolean;
}) {
  const classNames = [
    'transition-table__row',
    isActive && 'transition-table__row--active',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={classNames}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`Transition: ${formatTransitionRule(transition)}${isActive ? ' (active)' : ''}`}
    >
      <span className="transition-table__rule">
        {formatTransitionRule(transition)}
      </span>
      <span className="transition-table__explanation">
        {transition.explanation}
      </span>
    </li>
  );
}

/**
 * Displays all PDA transition rules with the active rule highlighted.
 *
 * - Renders each transition in `raA → r'ℓw` format (ε for empty replacement).
 * - Groups transitions by source state when `groupByState` is true.
 * - Highlights the currently applied transition row.
 * - Shows explanation text alongside each rule.
 */
export function TransitionTable({
  transitions,
  activeTransition,
  groupByState,
}: TransitionTableProps) {
  const groups: TransitionGroup[] = useMemo(() => {
    if (!groupByState) {
      return [{ state: '', transitions }];
    }

    const map = new Map<string, Transition[]>();
    for (const t of transitions) {
      const existing = map.get(t.fromState);
      if (existing) {
        existing.push(t);
      } else {
        map.set(t.fromState, [t]);
      }
    }

    return Array.from(map.entries()).map(([state, trans]) => ({
      state,
      transitions: trans,
    }));
  }, [transitions, groupByState]);

  const isActive = (t: Transition): boolean =>
    activeTransition !== null && transitionsMatch(t, activeTransition);

  return (
    <div className="transition-table" role="region" aria-label="Transition table">
      <span className="transition-table__label">Transitions</span>

      {groups.map((group, groupIndex) => (
        <div key={group.state || groupIndex}>
          {groupByState && group.state && (
            <div className="transition-table__group-heading" role="heading" aria-level={3}>
              State {group.state}
            </div>
          )}
          <ul className="transition-table__list" role="list">
            {group.transitions.map((t, index) => (
              <TransitionRow
                key={`${group.state}-${index}`}
                transition={t}
                isActive={isActive(t)}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
