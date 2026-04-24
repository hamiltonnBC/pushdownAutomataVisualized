import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComputationHistory } from './ComputationHistory';
import type { SimulatorSnapshot, Transition } from '../types/pda';

const makeTransition = (overrides: Partial<Transition> = {}): Transition => ({
  fromState: 'q',
  tapeSymbol: 'a',
  stackTop: '$',
  toState: 'q',
  headDirection: 'R',
  stackReplacement: ['$', 'S'],
  explanation: 'push S',
  ...overrides,
});

const makeSnapshot = (
  step: number,
  overrides: Partial<SimulatorSnapshot> = {},
): SimulatorSnapshot => ({
  step,
  headPosition: step,
  stack: ['$', 'S'],
  currentState: 'q',
  appliedTransition: step === 0 ? null : makeTransition(),
  annotation: `Step ${step}`,
  ...overrides,
});

describe('ComputationHistory', () => {
  it('renders an accessible region with label', () => {
    render(
      <ComputationHistory history={[]} currentStep={0} onRestoreStep={() => {}} />,
    );
    expect(
      screen.getByRole('region', { name: 'Computation history' }),
    ).toBeInTheDocument();
  });

  it('shows empty message when history is empty', () => {
    render(
      <ComputationHistory history={[]} currentStep={0} onRestoreStep={() => {}} />,
    );
    expect(screen.getByText('No steps yet.')).toBeInTheDocument();
  });

  it('renders the correct number of history entries', () => {
    const history = [makeSnapshot(0), makeSnapshot(1), makeSnapshot(2)];
    render(
      <ComputationHistory history={history} currentStep={2} onRestoreStep={() => {}} />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('displays step number for each entry', () => {
    const history = [makeSnapshot(0), makeSnapshot(1)];
    render(
      <ComputationHistory history={history} currentStep={1} onRestoreStep={() => {}} />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays "(initial)" for the first step with no applied transition', () => {
    const history = [makeSnapshot(0, { appliedTransition: null })];
    render(
      <ComputationHistory history={history} currentStep={0} onRestoreStep={() => {}} />,
    );
    expect(screen.getByText('(initial)')).toBeInTheDocument();
  });

  it('displays the transition rule in raA → r\'ℓw format', () => {
    const transition = makeTransition({
      fromState: 'q',
      tapeSymbol: 'a',
      stackTop: '$',
      toState: 'q',
      headDirection: 'R',
      stackReplacement: ['$', 'S'],
    });
    const history = [makeSnapshot(1, { appliedTransition: transition })];
    render(
      <ComputationHistory history={history} currentStep={1} onRestoreStep={() => {}} />,
    );
    // formatTransitionRule produces "qa$ → qR$S"
    expect(screen.getByText('qa$ → qR$S')).toBeInTheDocument();
  });

  it('displays head position for each entry', () => {
    const history = [makeSnapshot(0, { headPosition: 0 }), makeSnapshot(1, { headPosition: 1 })];
    render(
      <ComputationHistory history={history} currentStep={1} onRestoreStep={() => {}} />,
    );
    expect(screen.getByText('H:0')).toBeInTheDocument();
    expect(screen.getByText('H:1')).toBeInTheDocument();
  });

  it('displays stack contents for each entry', () => {
    const history = [makeSnapshot(0, { stack: ['$'] }), makeSnapshot(1, { stack: ['$', 'S'] })];
    render(
      <ComputationHistory history={history} currentStep={1} onRestoreStep={() => {}} />,
    );
    expect(screen.getByText('[$]')).toBeInTheDocument();
    expect(screen.getByText('[$, S]')).toBeInTheDocument();
  });

  it('highlights the current step entry', () => {
    const history = [makeSnapshot(0), makeSnapshot(1)];
    render(
      <ComputationHistory history={history} currentStep={1} onRestoreStep={() => {}} />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveClass('computation-history__entry--active');
    expect(items[0]).not.toHaveClass('computation-history__entry--active');
  });

  it('sets aria-current="step" on the active entry button', () => {
    const history = [makeSnapshot(0), makeSnapshot(1)];
    render(
      <ComputationHistory history={history} currentStep={1} onRestoreStep={() => {}} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveAttribute('aria-current', 'step');
    expect(buttons[0]).not.toHaveAttribute('aria-current');
  });

  it('calls onRestoreStep with the correct index when an entry is clicked', () => {
    const onRestoreStep = vi.fn();
    const history = [makeSnapshot(0), makeSnapshot(1), makeSnapshot(2)];
    render(
      <ComputationHistory
        history={history}
        currentStep={2}
        onRestoreStep={onRestoreStep}
      />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onRestoreStep).toHaveBeenCalledWith(0);

    fireEvent.click(buttons[1]);
    expect(onRestoreStep).toHaveBeenCalledWith(1);
  });

  it('renders entries in chronological order', () => {
    const history = [makeSnapshot(0), makeSnapshot(1), makeSnapshot(2)];
    render(
      <ComputationHistory history={history} currentStep={2} onRestoreStep={() => {}} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('Step 0'));
    expect(buttons[1]).toHaveAttribute('aria-label', expect.stringContaining('Step 1'));
    expect(buttons[2]).toHaveAttribute('aria-label', expect.stringContaining('Step 2'));
  });
});
