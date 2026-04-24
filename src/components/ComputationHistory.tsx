import type { SimulatorSnapshot } from '../types/pda';
import { formatTransitionRule } from './TransitionTable';
import './ComputationHistory.css';

export interface ComputationHistoryProps {
  /** Chronological list of computation snapshots */
  history: SimulatorSnapshot[];
  /** The step the simulator is currently at */
  currentStep: number;
  /** Callback when the user clicks a history entry to restore that step */
  onRestoreStep: (step: number) => void;
}

/**
 * Renders a scrollable list of completed computation steps.
 *
 * Each entry shows the step number, the transition rule applied (in raA → r'ℓw
 * format), the tape head position, and the stack contents. Clicking an entry
 * restores the simulator to that configuration.
 */
export function ComputationHistory({
  history,
  currentStep,
  onRestoreStep,
}: ComputationHistoryProps) {
  return (
    <div
      className="computation-history"
      role="region"
      aria-label="Computation history"
    >
      <span className="computation-history__label">History</span>

      {history.length === 0 ? (
        <p className="computation-history__empty">No steps yet.</p>
      ) : (
        <ol className="computation-history__list" role="list">
          {history.map((snapshot, index) => {
            const isActive = snapshot.step === currentStep;
            const rule = snapshot.appliedTransition
              ? formatTransitionRule(snapshot.appliedTransition)
              : '(initial)';

            const classNames = [
              'computation-history__entry',
              isActive && 'computation-history__entry--active',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={index} className={classNames}>
                <button
                  className="computation-history__button"
                  type="button"
                  onClick={() => onRestoreStep(index)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${snapshot.step}: ${rule}`}
                >
                  <span className="computation-history__step">
                    {snapshot.step}
                  </span>
                  <span className="computation-history__rule">{rule}</span>
                  <span className="computation-history__head">
                    H:{snapshot.headPosition}
                  </span>
                  <span className="computation-history__stack">
                    [{snapshot.stack.join(', ')}]
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
