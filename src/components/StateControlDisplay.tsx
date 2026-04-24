import './StateControlDisplay.css';

export interface StateControlDisplayProps {
  /** All states in Q */
  states: string[];
  /** The currently active state */
  currentState: string;
  /** The previous state (for transition animation), null if none */
  previousState: string | null;
}

/**
 * Renders PDA states as labeled circle nodes.
 *
 * - Each state in Q is displayed as a circle with its label.
 * - The current active state is highlighted with a colored fill/border.
 * - When the state changes, the new active state plays an entering
 *   animation and the previous state plays a leaving animation.
 */
export function StateControlDisplay({
  states,
  currentState,
  previousState,
}: StateControlDisplayProps) {
  return (
    <div
      className="state-control-display"
      role="region"
      aria-label="State control display"
    >
      <span className="state-control-display__label">States</span>
      <div className="state-control-display__nodes" role="list">
        {states.map((state) => {
          const isActive = state === currentState;
          const isEntering =
            isActive && previousState !== null && previousState !== currentState;
          const isLeaving =
            !isActive &&
            state === previousState &&
            previousState !== currentState;

          const classNames = [
            'state-control-display__node',
            isActive && 'state-control-display__node--active',
            isEntering && 'state-control-display__node--entering',
            isLeaving && 'state-control-display__node--leaving',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={state}
              className={classNames}
              role="listitem"
              aria-label={`State ${state}${isActive ? ' (active)' : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {state}
            </div>
          );
        })}
      </div>
    </div>
  );
}
