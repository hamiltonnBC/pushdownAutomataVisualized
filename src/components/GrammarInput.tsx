import { useState } from 'react';
import type { Grammar, ProductionRule } from '../types';
import './GrammarInput.css';

export interface GrammarInputProps {
  /** Current grammar being edited */
  grammar: Grammar;
  /** Whether the conversion is in progress (disables editing) */
  isConverting: boolean;
  /** Callback for grammar mutations */
  onSetGrammar: (grammar: Grammar) => void;
  /** Callback to start the conversion */
  onStartConversion: () => void;
}

const VARIABLE_REGEX = /^[A-Z]$/;
const TERMINAL_REGEX = /^[a-z0-9]$/;

/**
 * Grammar definition form for the CNF conversion page.
 *
 * Provides inputs for adding variables, terminals, production rules,
 * and selecting a start variable. Validates all inputs and shows
 * inline error messages for invalid entries.
 */
export function GrammarInput({
  grammar,
  isConverting,
  onSetGrammar,
  onStartConversion,
}: GrammarInputProps) {
  const [variableInput, setVariableInput] = useState('');
  const [variableError, setVariableError] = useState<string | null>(null);

  const [terminalInput, setTerminalInput] = useState('');
  const [terminalError, setTerminalError] = useState<string | null>(null);

  const [ruleLhs, setRuleLhs] = useState('');
  const [ruleRhs, setRuleRhs] = useState('');
  const [ruleError, setRuleError] = useState<string | null>(null);

  const [convertError, setConvertError] = useState<string | null>(null);

  // ── Variable handling ──

  function handleAddVariable() {
    const v = variableInput.trim();
    if (!VARIABLE_REGEX.test(v)) {
      setVariableError('Variable must be a single uppercase letter (A-Z).');
      return;
    }
    if (grammar.variables.includes(v)) {
      setVariableError(`Variable "${v}" already exists.`);
      return;
    }
    setVariableError(null);
    setVariableInput('');
    const updated: Grammar = {
      ...grammar,
      variables: [...grammar.variables, v],
      startVariable: grammar.startVariable || v,
    };
    onSetGrammar(updated);
  }

  function handleRemoveVariable(v: string) {
    const updatedVars = grammar.variables.filter((x) => x !== v);
    const updatedRules = grammar.rules.filter((r) => r.lhs !== v);
    const updatedStart =
      grammar.startVariable === v
        ? updatedVars[0] ?? ''
        : grammar.startVariable;
    onSetGrammar({
      ...grammar,
      variables: updatedVars,
      rules: updatedRules,
      startVariable: updatedStart,
    });
  }

  // ── Terminal handling ──

  function handleAddTerminal() {
    const t = terminalInput.trim();
    if (!TERMINAL_REGEX.test(t)) {
      setTerminalError(
        'Terminal must be a single lowercase letter (a-z) or digit (0-9).',
      );
      return;
    }
    if (grammar.terminals.includes(t)) {
      setTerminalError(`Terminal "${t}" already exists.`);
      return;
    }
    setTerminalError(null);
    setTerminalInput('');
    onSetGrammar({ ...grammar, terminals: [...grammar.terminals, t] });
  }

  function handleRemoveTerminal(t: string) {
    onSetGrammar({
      ...grammar,
      terminals: grammar.terminals.filter((x) => x !== t),
    });
  }

  // ── Rule handling ──

  function handleAddRule() {
    if (!ruleLhs) {
      setRuleError('Select a variable for the left-hand side.');
      return;
    }

    const rhsSymbols = ruleRhs.split('');
    const allSymbols = new Set([...grammar.variables, ...grammar.terminals]);

    const undefined_syms = rhsSymbols.filter((s) => !allSymbols.has(s));
    if (undefined_syms.length > 0) {
      setRuleError(
        `Undefined symbol(s): ${undefined_syms.map((s) => `"${s}"`).join(', ')}. Add them as variables or terminals first.`,
      );
      return;
    }

    setRuleError(null);
    const newRule: ProductionRule = { lhs: ruleLhs, rhs: rhsSymbols };
    onSetGrammar({ ...grammar, rules: [...grammar.rules, newRule] });
    setRuleRhs('');
  }

  function handleRemoveRule(index: number) {
    const updatedRules = grammar.rules.filter((_, i) => i !== index);
    onSetGrammar({ ...grammar, rules: updatedRules });
  }

  // ── Start variable ──

  function handleStartVariableChange(value: string) {
    onSetGrammar({ ...grammar, startVariable: value });
  }

  // ── Conversion ──

  function handleStartConversion() {
    if (grammar.rules.length === 0) {
      setConvertError('At least one production rule is required.');
      return;
    }
    if (!grammar.startVariable) {
      setConvertError('Select a start variable.');
      return;
    }
    setConvertError(null);
    onStartConversion();
  }

  function formatRule(rule: ProductionRule): string {
    const rhs = rule.rhs.length === 0 ? 'ε' : rule.rhs.join('');
    return `${rule.lhs} → ${rhs}`;
  }

  const canConvert =
    grammar.rules.length > 0 &&
    grammar.startVariable !== '' &&
    !isConverting;

  return (
    <div className="grammar-input" role="region" aria-label="Grammar input">
      {/* ── Variables ── */}
      <div className="grammar-input__section grammar-input__variables">
        <label
          className="grammar-input__label"
          htmlFor="grammar-input-variable"
        >
          Variables
        </label>
        <div className="grammar-input__row">
          <input
            id="grammar-input-variable"
            className={[
              'grammar-input__field',
              variableError && 'grammar-input__field--invalid',
            ]
              .filter(Boolean)
              .join(' ')}
            type="text"
            value={variableInput}
            onChange={(e) => {
              setVariableInput(e.target.value);
              if (variableError) setVariableError(null);
            }}
            placeholder="e.g. S"
            maxLength={1}
            disabled={isConverting}
            aria-invalid={variableError ? true : undefined}
            aria-describedby={
              variableError ? 'grammar-input-variable-error' : undefined
            }
          />
          <button
            className="grammar-input__add-btn"
            type="button"
            onClick={handleAddVariable}
            disabled={isConverting}
          >
            Add
          </button>
        </div>
        {variableError && (
          <p
            id="grammar-input-variable-error"
            className="grammar-input__error"
            role="alert"
          >
            {variableError}
          </p>
        )}
        {grammar.variables.length > 0 && (
          <ul className="grammar-input__list" aria-label="Variables list">
            {grammar.variables.map((v) => (
              <li key={v} className="grammar-input__list-item">
                {v}
                <button
                  className="grammar-input__remove-btn"
                  type="button"
                  onClick={() => handleRemoveVariable(v)}
                  disabled={isConverting}
                  aria-label={`Remove variable ${v}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Terminals ── */}
      <div className="grammar-input__section grammar-input__terminals">
        <label
          className="grammar-input__label"
          htmlFor="grammar-input-terminal"
        >
          Terminals
        </label>
        <div className="grammar-input__row">
          <input
            id="grammar-input-terminal"
            className={[
              'grammar-input__field',
              terminalError && 'grammar-input__field--invalid',
            ]
              .filter(Boolean)
              .join(' ')}
            type="text"
            value={terminalInput}
            onChange={(e) => {
              setTerminalInput(e.target.value);
              if (terminalError) setTerminalError(null);
            }}
            placeholder="e.g. a"
            maxLength={1}
            disabled={isConverting}
            aria-invalid={terminalError ? true : undefined}
            aria-describedby={
              terminalError ? 'grammar-input-terminal-error' : undefined
            }
          />
          <button
            className="grammar-input__add-btn"
            type="button"
            onClick={handleAddTerminal}
            disabled={isConverting}
          >
            Add
          </button>
        </div>
        {terminalError && (
          <p
            id="grammar-input-terminal-error"
            className="grammar-input__error"
            role="alert"
          >
            {terminalError}
          </p>
        )}
        {grammar.terminals.length > 0 && (
          <ul className="grammar-input__list" aria-label="Terminals list">
            {grammar.terminals.map((t) => (
              <li key={t} className="grammar-input__list-item">
                {t}
                <button
                  className="grammar-input__remove-btn"
                  type="button"
                  onClick={() => handleRemoveTerminal(t)}
                  disabled={isConverting}
                  aria-label={`Remove terminal ${t}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Rules ── */}
      <div className="grammar-input__section grammar-input__rules">
        <label className="grammar-input__label" htmlFor="grammar-input-rhs">
          Production Rules
        </label>
        <div className="grammar-input__row">
          <select
            className="grammar-input__select"
            value={ruleLhs}
            onChange={(e) => setRuleLhs(e.target.value)}
            disabled={isConverting || grammar.variables.length === 0}
            aria-label="Rule left-hand side variable"
          >
            <option value="">LHS</option>
            {grammar.variables.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span className="grammar-input__arrow">→</span>
          <input
            id="grammar-input-rhs"
            className={[
              'grammar-input__field',
              ruleError && 'grammar-input__field--invalid',
            ]
              .filter(Boolean)
              .join(' ')}
            type="text"
            value={ruleRhs}
            onChange={(e) => {
              setRuleRhs(e.target.value);
              if (ruleError) setRuleError(null);
            }}
            placeholder="RHS (e.g. aAb or empty for ε)"
            disabled={isConverting}
            aria-invalid={ruleError ? true : undefined}
            aria-describedby={
              ruleError ? 'grammar-input-rule-error' : undefined
            }
          />
          <button
            className="grammar-input__add-btn"
            type="button"
            onClick={handleAddRule}
            disabled={isConverting}
          >
            Add
          </button>
        </div>
        {ruleError && (
          <p
            id="grammar-input-rule-error"
            className="grammar-input__error"
            role="alert"
          >
            {ruleError}
          </p>
        )}
        {grammar.rules.length > 0 && (
          <ul className="grammar-input__rules-list" aria-label="Rules list">
            {grammar.rules.map((rule, i) => (
              <li key={i} className="grammar-input__rule-item">
                <span>{formatRule(rule)}</span>
                <button
                  className="grammar-input__remove-btn"
                  type="button"
                  onClick={() => handleRemoveRule(i)}
                  disabled={isConverting}
                  aria-label={`Remove rule ${formatRule(rule)}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Start Variable ── */}
      <div className="grammar-input__section grammar-input__start-section">
        <label
          className="grammar-input__label"
          htmlFor="grammar-input-start-variable"
        >
          Start Variable
        </label>
        <select
          id="grammar-input-start-variable"
          className="grammar-input__select"
          value={grammar.startVariable}
          onChange={(e) => handleStartVariableChange(e.target.value)}
          disabled={isConverting || grammar.variables.length === 0}
        >
          <option value="">Select start variable</option>
          {grammar.variables.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* ── Start Conversion ── */}
      <div className="grammar-input__section">
        <button
          className="grammar-input__convert-btn"
          type="button"
          onClick={handleStartConversion}
          disabled={!canConvert}
        >
          Start Conversion
        </button>
        {convertError && (
          <p className="grammar-input__error" role="alert">
            {convertError}
          </p>
        )}
      </div>
    </div>
  );
}
