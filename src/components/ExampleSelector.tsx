import type { PDADefinition } from '../types';
import './ExampleSelector.css';

export interface ExampleSelectorProps {
  /** The list of available PDA examples */
  examples: PDADefinition[];
  /** The currently selected PDA example */
  currentExample: PDADefinition;
  /** Callback when the user selects a different example */
  onSelect: (example: PDADefinition) => void;
}

/**
 * Renders a button group for selecting among the predefined PDA examples.
 *
 * The currently selected example is visually highlighted.
 * On selection the parent is notified via `onSelect` so it can
 * dispatch SELECT_EXAMPLE and reset the simulator.
 */
export function ExampleSelector({
  examples,
  currentExample,
  onSelect,
}: ExampleSelectorProps) {
  return (
    <div className="example-selector" role="region" aria-label="Example selector">
      <span className="example-selector__label" id="example-selector-label">
        PDA Examples
      </span>
      <a
        className="example-selector__video-link"
        href="https://www.youtube.com/watch?v=yYmlqXBtO-Q"
        target="_blank"
        rel="noopener noreferrer"
      >
        ▶ Video Guide
      </a>
      <div
        className="example-selector__options"
        role="radiogroup"
        aria-labelledby="example-selector-label"
      >
        {examples.slice(0, 2).map((example) => {
          const isActive = example.name === currentExample.name;
          const classNames = [
            'example-selector__option',
            isActive && 'example-selector__option--active',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={example.name}
              className={classNames}
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(example)}
            >
              {example.name}
            </button>
          );
        })}
      </div>
      <div className="example-selector__options">
        {examples.slice(2).map((example) => {
          const isActive = example.name === currentExample.name;
          const classNames = [
            'example-selector__option',
            isActive && 'example-selector__option--active',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={example.name}
              className={classNames}
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(example)}
            >
              {example.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
