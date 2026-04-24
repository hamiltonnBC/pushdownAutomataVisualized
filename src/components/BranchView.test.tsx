import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BranchView } from './BranchView';
import type { ComputationBranch, Transition, SimulatorSnapshot } from '../types/pda';

const makeTransition = (overrides: Partial<Transition> = {}): Transition => ({
  fromState: 'q',
  tapeSymbol: 'b',
  stackTop: 'S',
  toState: 'q2',
  headDirection: 'R',
  stackReplacement: [],
  explanation: 'guess middle',
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

const makeBranch = (
  overrides: Partial<ComputationBranch> = {},
): ComputationBranch => ({
  id: 'branch-1-0',
  parentId: null,
  snapshots: [makeSnapshot(0), makeSnapshot(1)],
  status: 'active',
  ...overrides,
});

describe('BranchView', () => {
  it('renders an accessible region with label', () => {
    render(
      <BranchView branches={[]} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    expect(
      screen.getByRole('region', { name: 'Computation branches' }),
    ).toBeInTheDocument();
  });

  it('shows empty message when there are no branches', () => {
    render(
      <BranchView branches={[]} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    expect(
      screen.getByText('No branches yet. Nondeterministic choices will appear here.'),
    ).toBeInTheDocument();
  });

  it('renders the correct number of branch entries', () => {
    const branches = [
      makeBranch({ id: 'branch-1-0' }),
      makeBranch({ id: 'branch-1-1' }),
    ];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    const items = screen.getAllByRole('treeitem');
    expect(items).toHaveLength(2);
  });

  it('displays branch ID for each entry', () => {
    const branches = [
      makeBranch({ id: 'branch-1-0' }),
      makeBranch({ id: 'branch-1-1' }),
    ];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    expect(screen.getByText('branch-1-0')).toBeInTheDocument();
    expect(screen.getByText('branch-1-1')).toBeInTheDocument();
  });

  it('displays branch status for each entry', () => {
    const branches = [
      makeBranch({ id: 'b-0', status: 'accepted' }),
      makeBranch({ id: 'b-1', status: 'rejected' }),
      makeBranch({ id: 'b-2', status: 'looping' }),
    ];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    expect(screen.getByText('accepted')).toBeInTheDocument();
    expect(screen.getByText('rejected')).toBeInTheDocument();
    expect(screen.getByText('looping')).toBeInTheDocument();
  });

  it('highlights accepted branches in green', () => {
    const branches = [makeBranch({ id: 'b-0', status: 'accepted' })];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    const item = screen.getByRole('treeitem');
    expect(item).toHaveClass('branch-view__branch--accepted');
  });

  it('highlights rejected branches in red', () => {
    const branches = [makeBranch({ id: 'b-0', status: 'rejected' })];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    const item = screen.getByRole('treeitem');
    expect(item).toHaveClass('branch-view__branch--rejected');
  });

  it('highlights looping branches in amber', () => {
    const branches = [makeBranch({ id: 'b-0', status: 'looping' })];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    const item = screen.getByRole('treeitem');
    expect(item).toHaveClass('branch-view__branch--looping');
  });

  it('highlights the active branch', () => {
    const branches = [
      makeBranch({ id: 'b-0' }),
      makeBranch({ id: 'b-1' }),
    ];
    render(
      <BranchView branches={branches} activeBranchId="b-1" onSelectBranch={() => {}} />,
    );
    const items = screen.getAllByRole('treeitem');
    expect(items[1]).toHaveClass('branch-view__branch--selected');
    expect(items[0]).not.toHaveClass('branch-view__branch--selected');
  });

  it('sets aria-selected on the active branch', () => {
    const branches = [
      makeBranch({ id: 'b-0' }),
      makeBranch({ id: 'b-1' }),
    ];
    render(
      <BranchView branches={branches} activeBranchId="b-0" onSelectBranch={() => {}} />,
    );
    const items = screen.getAllByRole('treeitem');
    expect(items[0]).toHaveAttribute('aria-selected', 'true');
    expect(items[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onSelectBranch with the correct branch ID when clicked', () => {
    const onSelectBranch = vi.fn();
    const branches = [
      makeBranch({ id: 'b-0' }),
      makeBranch({ id: 'b-1' }),
    ];
    render(
      <BranchView
        branches={branches}
        activeBranchId={null}
        onSelectBranch={onSelectBranch}
      />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onSelectBranch).toHaveBeenCalledWith('b-0');

    fireEvent.click(buttons[1]);
    expect(onSelectBranch).toHaveBeenCalledWith('b-1');
  });

  it('displays the last transition rule for each branch', () => {
    const transition = makeTransition({
      fromState: 'q',
      tapeSymbol: 'b',
      stackTop: 'S',
      toState: 'q2',
      headDirection: 'R',
      stackReplacement: [],
    });
    const branches = [
      makeBranch({
        id: 'b-0',
        snapshots: [makeSnapshot(1, { appliedTransition: transition })],
      }),
    ];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    // formatTransitionRule produces "qbS → q2Rε"
    expect(screen.getByText('qbS → q2Rε')).toBeInTheDocument();
  });

  it('displays "(none)" when a branch has no snapshots', () => {
    const branches = [makeBranch({ id: 'b-0', snapshots: [] })];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    expect(screen.getByText('(none)')).toBeInTheDocument();
  });

  it('applies child indentation class for branches with a parentId', () => {
    const branches = [
      makeBranch({ id: 'b-0', parentId: null }),
      makeBranch({ id: 'b-1', parentId: 'b-0' }),
    ];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    const items = screen.getAllByRole('treeitem');
    expect(items[0]).not.toHaveClass('branch-view__branch--child');
    expect(items[1]).toHaveClass('branch-view__branch--child');
  });

  it('provides accessible button labels with branch ID and status', () => {
    const branches = [makeBranch({ id: 'b-0', status: 'accepted' })];
    render(
      <BranchView branches={branches} activeBranchId={null} onSelectBranch={() => {}} />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Branch b-0: accepted');
  });
});
