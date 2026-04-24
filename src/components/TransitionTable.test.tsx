import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransitionTable, formatTransitionRule } from './TransitionTable';
import type { Transition } from '../types/pda';

/** Helper to create a transition with sensible defaults. */
function makeTransition(overrides: Partial<Transition> = {}): Transition {
  return {
    fromState: 'q',
    tapeSymbol: 'a',
    stackTop: '$',
    toState: 'q',
    headDirection: 'R',
    stackReplacement: ['$', 'S'],
    explanation: 'push S',
    ...overrides,
  };
}

describe('formatTransitionRule', () => {
  it('formats a transition with stack replacement', () => {
    const t = makeTransition({
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: '$',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['$', 'S'],
    });
    expect(formatTransitionRule(t)).toBe('qa$ → qR$S');
  });

  it('uses ε for empty stack replacement (pop)', () => {
    const t = makeTransition({
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: 'S',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: [],
    });
    expect(formatTransitionRule(t)).toBe('qbS → qRε');
  });

  it('formats N head direction correctly', () => {
    const t = makeTransition({
      fromState: 'q0',
      tapeSymbol: '□',
      stackTop: 'S',
      toState: 'q0',
      headDirection: 'N',
      stackReplacement: ['S'],
    });
    expect(formatTransitionRule(t)).toBe('q0□S → q0NS');
  });
});

describe('TransitionTable', () => {
  const singleStateTransitions: Transition[] = [
    makeTransition({
      tapeSymbol: 'a',
      stackTop: '$',
      stackReplacement: ['$', 'S'],
      explanation: "Reading '(' with empty stack: push S",
    }),
    makeTransition({
      tapeSymbol: 'b',
      stackTop: 'S',
      stackReplacement: [],
      explanation: "Reading ')' with S on top: pop S",
    }),
  ];

  it('renders all transitions as list items', () => {
    render(
      <TransitionTable
        transitions={singleStateTransitions}
        activeTransition={null}
        groupByState={false}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  it('displays each transition in raA → r\'ℓw format', () => {
    render(
      <TransitionTable
        transitions={singleStateTransitions}
        activeTransition={null}
        groupByState={false}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('qa$ → qR$S');
    expect(items[1]).toHaveTextContent('qbS → qRε');
  });

  it('shows explanation text alongside each rule', () => {
    render(
      <TransitionTable
        transitions={singleStateTransitions}
        activeTransition={null}
        groupByState={false}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent("Reading '(' with empty stack: push S");
    expect(items[1]).toHaveTextContent("Reading ')' with S on top: pop S");
  });

  it('highlights the active transition row', () => {
    const active = singleStateTransitions[1];
    render(
      <TransitionTable
        transitions={singleStateTransitions}
        activeTransition={active}
        groupByState={false}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).not.toHaveClass('transition-table__row--active');
    expect(items[1]).toHaveClass('transition-table__row--active');
  });

  it('sets aria-current on the active transition only', () => {
    const active = singleStateTransitions[0];
    render(
      <TransitionTable
        transitions={singleStateTransitions}
        activeTransition={active}
        groupByState={false}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('aria-current', 'true');
    expect(items[1]).not.toHaveAttribute('aria-current');
  });

  it('does not highlight any row when activeTransition is null', () => {
    render(
      <TransitionTable
        transitions={singleStateTransitions}
        activeTransition={null}
        groupByState={false}
      />,
    );

    const items = screen.getAllByRole('listitem');
    items.forEach((item) => {
      expect(item).not.toHaveClass('transition-table__row--active');
      expect(item).not.toHaveAttribute('aria-current');
    });
  });

  it('has an accessible region label', () => {
    render(
      <TransitionTable
        transitions={singleStateTransitions}
        activeTransition={null}
        groupByState={false}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'Transition table' }),
    ).toBeInTheDocument();
  });

  describe('groupByState', () => {
    const multiStateTransitions: Transition[] = [
      makeTransition({
        fromState: 'q0',
        tapeSymbol: '0',
        stackTop: '$',
        stackReplacement: ['$', 'S'],
        explanation: 'Reading 0, push S',
      }),
      makeTransition({
        fromState: 'q0',
        tapeSymbol: '1',
        stackTop: 'S',
        toState: 'q1',
        stackReplacement: [],
        explanation: 'First 1: switch to q1, pop S',
      }),
      makeTransition({
        fromState: 'q1',
        tapeSymbol: '1',
        stackTop: 'S',
        toState: 'q1',
        stackReplacement: [],
        explanation: 'Reading 1: pop S',
      }),
      makeTransition({
        fromState: 'q1',
        tapeSymbol: '□',
        stackTop: '$',
        toState: 'q1',
        headDirection: 'N',
        stackReplacement: [],
        explanation: 'End of input, accept',
      }),
    ];

    it('groups transitions by source state with headings', () => {
      render(
        <TransitionTable
          transitions={multiStateTransitions}
          activeTransition={null}
          groupByState={true}
        />,
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('State q0');
      expect(headings[1]).toHaveTextContent('State q1');
    });

    it('places correct transitions under each group', () => {
      render(
        <TransitionTable
          transitions={multiStateTransitions}
          activeTransition={null}
          groupByState={true}
        />,
      );

      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(2);

      const q0Items = within(lists[0]).getAllByRole('listitem');
      expect(q0Items).toHaveLength(2);
      expect(q0Items[0]).toHaveTextContent('q00$');
      expect(q0Items[1]).toHaveTextContent('q01S');

      const q1Items = within(lists[1]).getAllByRole('listitem');
      expect(q1Items).toHaveLength(2);
    });

    it('does not show group headings when groupByState is false', () => {
      render(
        <TransitionTable
          transitions={multiStateTransitions}
          activeTransition={null}
          groupByState={false}
        />,
      );

      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('highlights active transition within a group', () => {
      const active = multiStateTransitions[2]; // q1 group, first transition
      render(
        <TransitionTable
          transitions={multiStateTransitions}
          activeTransition={active}
          groupByState={true}
        />,
      );

      const lists = screen.getAllByRole('list');
      const q1Items = within(lists[1]).getAllByRole('listitem');
      expect(q1Items[0]).toHaveClass('transition-table__row--active');

      // q0 items should not be active
      const q0Items = within(lists[0]).getAllByRole('listitem');
      q0Items.forEach((item) => {
        expect(item).not.toHaveClass('transition-table__row--active');
      });
    });
  });

  it('renders an empty list when no transitions are provided', () => {
    render(
      <TransitionTable
        transitions={[]}
        activeTransition={null}
        groupByState={false}
      />,
    );

    expect(screen.getByRole('region', { name: 'Transition table' })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
