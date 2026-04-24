import { useState } from 'react';
import type { FormEvent } from 'react';
import type { PredefinedInput } from '../types';
import { validateInput } from '../engine/simulator';
import './StringInput.css';

export interface StringInputProps {
  /** The current PDA's tape alphabet (Σ) for validation */
  tapeAlphabet: string[];
  /** Predefined example strings for the current PDA */
  predefinedInputs: PredefinedInput[];
  /** Callback when a valid string is submitted */
  onSubmit: (input: string) => void;
}

/**
 * Text input for custom strings with validation against the current Σ,
 * plus predefined example string buttons for the current PDA.
 *
 * On submit the input is validated; if invalid, an error message lists
 * the offending symbols. If valid, `onSubmit` is called with the string.
 * Clicking a predefined string button calls `onSubmit` directly.
 */
export function StringInput({
  tapeAlphabet,
  predefinedInputs,
  onSubmit,
}: StringInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateInput(value, tapeAlphabet);
    if (!result.valid) {
      setError(
        `Invalid symbols: ${result.invalidSymbols.map((s) => `"${s}"`).join(', ')}`,
      );
      return;
    }
    setError(null);
    onSubmit(value);
  }

  function handlePredefinedClick(predefined: PredefinedInput) {
    setError(null);
    setValue(predefined.value);
    onSubmit(predefined.value);
  }

  const fieldClasses = [
    'string-input__field',
    error && 'string-input__field--invalid',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="string-input" role="region" aria-label="String input">
      <label className="string-input__label" htmlFor="string-input-field">
        Input String
      </label>

      <form className="string-input__form" onSubmit={handleSubmit}>
        <input
          id="string-input-field"
          className={fieldClasses}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder={`Symbols: ${tapeAlphabet.join(', ')}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'string-input-error' : undefined}
        />
        <button className="string-input__submit" type="submit">
          Load
        </button>
      </form>

      {error && (
        <p id="string-input-error" className="string-input__error" role="alert">
          {error}
        </p>
      )}

      {predefinedInputs.length > 0 && (
        <>
          <span className="string-input__predefined-label">
            Predefined Strings
          </span>
          <div className="string-input__predefined" role="group" aria-label="Predefined input strings">
            {predefinedInputs.map((pi) => {
              const metaClass = [
                'string-input__predefined-meta',
                pi.expectedResult === 'accept' && 'string-input__predefined-meta--accept',
                pi.expectedResult === 'reject' && 'string-input__predefined-meta--reject',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={`${pi.value}-${pi.expectedResult}`}
                  className="string-input__predefined-btn"
                  type="button"
                  onClick={() => handlePredefinedClick(pi)}
                  aria-label={`Load "${pi.value || 'ε'}" (${pi.expectedResult}: ${pi.description})`}
                >
                  <span className="string-input__predefined-value">
                    {pi.value || 'ε'}
                  </span>
                  <span className={metaClass}>
                    {pi.expectedResult} — {pi.description}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
