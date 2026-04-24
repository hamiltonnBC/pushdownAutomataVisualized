import type { PDADefinition } from '../types/pda';
import './FormalDefinitionDisplay.css';

export interface FormalDefinitionDisplayProps {
  /** The PDA definition to render as a formal 5-tuple */
  definition: PDADefinition;
}

/**
 * Formats an array of strings as a set: {a, b, c}
 */
function formatSet(items: string[]): string {
  return `{${items.join(', ')}}`;
}

/**
 * Renders the formal 5-tuple PDA definition M = (Σ, Γ, Q, δ, q)
 * using Unicode Greek letters and set notation.
 *
 * Updates automatically when the definition prop changes (new example selected).
 */
export function FormalDefinitionDisplay({ definition }: FormalDefinitionDisplayProps) {
  return (
    <div
      className="formal-definition"
      role="region"
      aria-label="Formal PDA definition"
    >
      <span className="formal-definition__label">Formal Definition</span>

      <div className="formal-definition__tuple">
        <span className="formal-definition__math">
          M = (Σ, Γ, Q, δ, q)
        </span>
      </div>

      <dl className="formal-definition__components">
        <div className="formal-definition__entry">
          <dt className="formal-definition__symbol">Σ</dt>
          <dd className="formal-definition__value">
            = {formatSet(definition.tapeAlphabet)}
          </dd>
        </div>

        <div className="formal-definition__entry">
          <dt className="formal-definition__symbol">Γ</dt>
          <dd className="formal-definition__value">
            = {formatSet(definition.stackAlphabet)}
          </dd>
        </div>

        <div className="formal-definition__entry">
          <dt className="formal-definition__symbol">Q</dt>
          <dd className="formal-definition__value">
            = {formatSet(definition.states)}
          </dd>
        </div>

        <div className="formal-definition__entry">
          <dt className="formal-definition__symbol">δ</dt>
          <dd className="formal-definition__value">
            = {definition.transitions.length} transition{definition.transitions.length !== 1 ? 's' : ''} (see transition table)
          </dd>
        </div>

        <div className="formal-definition__entry">
          <dt className="formal-definition__symbol">q</dt>
          <dd className="formal-definition__value">
            = {definition.startState}
          </dd>
        </div>
      </dl>
    </div>
  );
}
