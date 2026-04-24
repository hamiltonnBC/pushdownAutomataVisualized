import './TapeDisplay.css';

export interface TapeDisplayProps {
  /** Tape contents: input symbols followed by blank □ */
  tape: string[];
  /** Index of the cell currently scanned by the tape head */
  headPosition: number;
}

/**
 * Renders the PDA tape as a horizontal row of cells.
 *
 * - One symbol per cell, with a trailing blank cell (□).
 * - The cell at `headPosition` is highlighted to indicate the tape head.
 * - CSS transitions animate the highlight shift on R moves;
 *   on N moves the indicator stays put naturally.
 */
export function TapeDisplay({ tape, headPosition }: TapeDisplayProps) {
  return (
    <div className="tape-display" role="region" aria-label="Tape display">
      <span className="tape-display__label">Tape</span>
      <div className="tape-display__cells" role="list">
        {tape.map((symbol, index) => {
          const isActive = index === headPosition;
          const isBlank = symbol === '□';

          const classNames = [
            'tape-display__cell',
            isActive && 'tape-display__cell--active',
            isBlank && 'tape-display__cell--blank',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={index}
              className={classNames}
              role="listitem"
              aria-label={`Cell ${index}: ${isBlank ? 'blank' : symbol}${isActive ? ' (head)' : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {symbol}
            </div>
          );
        })}
      </div>
    </div>
  );
}
