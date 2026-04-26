import type { Grammar, ProductionRule } from '../types';
import './GrammarDisplay.css';

export interface GrammarDisplayProps {
  /** The grammar to display */
  grammar: Grammar;
  /** Rules that were added in the current sub-step (highlighted green) */
  addedRules: ProductionRule[];
  /** Rules that were removed in the current sub-step (highlighted red) */
  removedRules: ProductionRule[];
  /** Current conversion step number (1-5) and label */
  currentStep: { number: number; label: string } | null;
}

function formatRule(rule: ProductionRule): string {
  const rhs = rule.rhs.length === 0 ? 'ε' : rule.rhs.join('');
  return `${rule.lhs} → ${rhs}`;
}

function rulesMatch(a: ProductionRule, b: ProductionRule): boolean {
  return a.lhs === b.lhs && a.rhs.length === b.rhs.length && a.rhs.every((s, i) => s === b.rhs[i]);
}

function isInList(rule: ProductionRule, list: ProductionRule[]): boolean {
  return list.some((r) => rulesMatch(r, rule));
}

/**
 * Displays the current grammar state in a formatted panel.
 *
 * Shows G = (V, Σ, R, S) with variables, terminals, start variable,
 * and all production rules. During conversion, highlights added rules
 * (green) and removed rules (red with strikethrough), and shows the
 * current step number and label.
 */
export function GrammarDisplay({
  grammar,
  addedRules,
  removedRules,
  currentStep,
}: GrammarDisplayProps) {
  // Build the combined rule list: current grammar rules + removed rules (shown struck-through)
  const allRules: { rule: ProductionRule; status: 'added' | 'removed' | 'normal' }[] = [];

  // Add removed rules first (they're no longer in grammar.rules)
  for (const rule of removedRules) {
    allRules.push({ rule, status: 'removed' });
  }

  // Add current grammar rules, marking added ones
  for (const rule of grammar.rules) {
    const status = isInList(rule, addedRules) ? 'added' : 'normal';
    allRules.push({ rule, status });
  }

  return (
    <div className="grammar-display" role="region" aria-label="Grammar display">
      {currentStep && (
        <div className="grammar-display__step-header">
          Step {currentStep.number}: {currentStep.label}
        </div>
      )}

      <div className="grammar-display__definition">
        <span className="grammar-display__formal">
          G = (V, Σ, R, S)
        </span>
      </div>

      <div className="grammar-display__section">
        <span className="grammar-display__label">Variables (V):</span>
        <span className="grammar-display__value">
          {'{' + grammar.variables.join(', ') + '}'}
        </span>
      </div>

      <div className="grammar-display__section">
        <span className="grammar-display__label">Terminals (Σ):</span>
        <span className="grammar-display__value">
          {'{' + grammar.terminals.join(', ') + '}'}
        </span>
      </div>

      <div className="grammar-display__section">
        <span className="grammar-display__label">Start Variable (S):</span>
        <span className="grammar-display__value">{grammar.startVariable}</span>
      </div>

      <div className="grammar-display__section">
        <span className="grammar-display__label">Production Rules (R):</span>
        <ul className="grammar-display__rules" aria-label="Production rules">
          {allRules.map((entry, i) => {
            const className = [
              'grammar-display__rule',
              entry.status === 'added' && 'grammar-display__rule--added',
              entry.status === 'removed' && 'grammar-display__rule--removed',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={`${entry.status}-${i}`} className={className}>
                {formatRule(entry.rule)}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
