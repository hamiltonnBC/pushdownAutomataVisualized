import type { ComputationBranch } from '../types/pda';
import { formatTransitionRule } from './TransitionTable';
import './BranchView.css';

export interface BranchViewProps {
  /** All computation branches for the current nondeterministic simulation */
  branches: ComputationBranch[];
  /** ID of the currently active/selected branch */
  activeBranchId: string | null;
  /** Callback when the user clicks a branch to select it */
  onSelectBranch: (id: string) => void;
}

/**
 * Renders computation branches as a tree structure for nondeterministic PDAs.
 *
 * Each branch shows its ID, status (active/accepted/rejected/looping), and the
 * last transition applied. Accepted branches are highlighted in green, rejected
 * in red, and looping in amber. Clicking a branch loads its computation into
 * the main displays.
 */
export function BranchView({
  branches,
  activeBranchId,
  onSelectBranch,
}: BranchViewProps) {
  return (
    <div className="branch-view" role="region" aria-label="Computation branches">
      <span className="branch-view__label">Branches</span>

      {branches.length === 0 ? (
        <p className="branch-view__empty">
          No branches yet. Nondeterministic choices will appear here.
        </p>
      ) : (
        <ul className="branch-view__tree" role="tree">
          {branches.map((branch) => {
            const isActive = branch.id === activeBranchId;
            const isChild = branch.parentId !== null;

            const lastSnapshot =
              branch.snapshots.length > 0
                ? branch.snapshots[branch.snapshots.length - 1]
                : null;

            const lastTransitionLabel = lastSnapshot?.appliedTransition
              ? formatTransitionRule(lastSnapshot.appliedTransition)
              : '(none)';

            const branchClassNames = [
              'branch-view__branch',
              isActive && 'branch-view__branch--selected',
              `branch-view__branch--${branch.status}`,
              isChild && 'branch-view__branch--child',
            ]
              .filter(Boolean)
              .join(' ');

            const statusClassNames = [
              'branch-view__status',
              `branch-view__status--${branch.status}`,
            ].join(' ');

            return (
              <li
                key={branch.id}
                className={branchClassNames}
                role="treeitem"
                aria-selected={isActive}
              >
                <button
                  className="branch-view__button"
                  type="button"
                  onClick={() => onSelectBranch(branch.id)}
                  aria-label={`Branch ${branch.id}: ${branch.status}`}
                >
                  <span className="branch-view__id">{branch.id}</span>
                  <span className={statusClassNames}>{branch.status}</span>
                  <span className="branch-view__transition">
                    {lastTransitionLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
