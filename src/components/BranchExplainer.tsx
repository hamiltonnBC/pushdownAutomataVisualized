import type { SimulatorState } from '../types';
import './BranchExplainer.css';

export interface BranchExplainerProps {
  isNondeterministic: boolean;
  status: SimulatorState['status'];
  branchCount: number;
}

/**
 * Educational explanation of nondeterministic branching.
 * Only visible when the selected PDA is nondeterministic.
 */
export function BranchExplainer({ isNondeterministic, status, branchCount }: BranchExplainerProps) {
  if (!isNondeterministic) return null;

  return (
    <div className="branch-explainer" role="region" aria-label="Branching explanation">
      <span className="branch-explainer__label">About Nondeterministic Branches</span>

      <p className="branch-explainer__text">
        This PDA is <strong>nondeterministic</strong>;  at certain points during computation,
        more than one transition rule applies. The machine can't "see ahead" to know which
        choice leads to acceptance, so it has to <strong>guess</strong>.
      </p>

      <p className="branch-explainer__text">
        Each guess creates a <strong>branch</strong>. A branch represents one possible
        path the computation could take. The PDA accepts the input if <em>at least one</em> branch
        leads to acceptance; even if every other branch fails.
      </p>

      {status === 'branching' && (
        <p className="branch-explainer__prompt">
          ⚡ A nondeterministic choice point was reached. Pick a branch below to continue
          the simulation along that path.
        </p>
      )}

      {branchCount > 0 && status !== 'branching' && (
        <p className="branch-explainer__hint">
          {branchCount} branch{branchCount !== 1 ? 'es' : ''} recorded so far.
          Click any branch below to switch to that computation path.
        </p>
      )}
    </div>
  );
}
