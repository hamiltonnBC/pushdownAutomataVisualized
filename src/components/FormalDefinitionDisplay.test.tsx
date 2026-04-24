import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormalDefinitionDisplay } from './FormalDefinitionDisplay';
import type { PDADefinition } from '../types/pda';

const singleStatePDA: PDADefinition = {
  name: 'Nested Parentheses',
  description: 'Accepts properly nested parentheses',
  tapeAlphabet: ['a', 'b'],
  stackAlphabet: ['$', 'S'],
  states: ['q'],
  startState: 'q',
  transitions: [
    { fromState: 'q', tapeSymbol: 'a', stackTop: '$', toState: 'q', headDirection: 'R', stackReplacement: ['$', 'S'], explanation: 'push S' },
    { fromState: 'q', tapeSymbol: 'b', stackTop: 'S', toState: 'q', headDirection: 'R', stackReplacement: [], explanation: 'pop S' },
  ],
  isNondeterministic: false,
  predefinedInputs: [],
};

const multiStatePDA: PDADefinition = {
  name: '0^n 1^n',
  description: 'Accepts 0^n 1^n',
  tapeAlphabet: ['0', '1'],
  stackAlphabet: ['$', 'S'],
  states: ['q0', 'q1'],
  startState: 'q0',
  transitions: [
    { fromState: 'q0', tapeSymbol: '0', stackTop: '$', toState: 'q0', headDirection: 'R', stackReplacement: ['$', 'S'], explanation: 'push' },
  ],
  isNondeterministic: false,
  predefinedInputs: [],
};

describe('FormalDefinitionDisplay', () => {
  it('has an accessible region label', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    expect(screen.getByRole('region', { name: 'Formal PDA definition' })).toBeInTheDocument();
  });

  it('renders the 5-tuple header M = (Σ, Γ, Q, δ, q)', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    expect(screen.getByText('M = (Σ, Γ, Q, δ, q)')).toBeInTheDocument();
  });

  it('displays the tape alphabet Σ in set notation', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    expect(screen.getByText('Σ')).toBeInTheDocument();
    expect(screen.getByText('= {a, b}')).toBeInTheDocument();
  });

  it('displays the stack alphabet Γ in set notation', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    expect(screen.getByText('Γ')).toBeInTheDocument();
    expect(screen.getByText('= {$, S}')).toBeInTheDocument();
  });

  it('displays the states Q in set notation', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    expect(screen.getByText('Q')).toBeInTheDocument();
    expect(screen.getByText('= {q}')).toBeInTheDocument();
  });

  it('displays the transition count with reference to table', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    expect(screen.getByText('δ')).toBeInTheDocument();
    expect(screen.getByText('= 2 transitions (see transition table)')).toBeInTheDocument();
  });

  it('displays the start state q', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    // There are multiple 'q' elements (the symbol label and the value), so check the value
    const values = screen.getAllByText('= q');
    expect(values.length).toBeGreaterThanOrEqual(1);
  });

  it('updates when a different definition is provided', () => {
    const { rerender } = render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    expect(screen.getByText('= {a, b}')).toBeInTheDocument();
    expect(screen.getByText('= {q}')).toBeInTheDocument();

    rerender(<FormalDefinitionDisplay definition={multiStatePDA} />);
    expect(screen.getByText('= {0, 1}')).toBeInTheDocument();
    expect(screen.getByText('= {q0, q1}')).toBeInTheDocument();
    expect(screen.getByText('= q0')).toBeInTheDocument();
  });

  it('handles singular transition count', () => {
    const singleTransition: PDADefinition = {
      ...singleStatePDA,
      transitions: [singleStatePDA.transitions[0]],
    };
    render(<FormalDefinitionDisplay definition={singleTransition} />);
    expect(screen.getByText('= 1 transition (see transition table)')).toBeInTheDocument();
  });

  it('renders Greek letter symbols Σ, Γ, δ using Unicode', () => {
    render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    // Verify the Greek letters are present as dt elements
    const terms = screen.getAllByRole('term');
    const termTexts = terms.map((t) => t.textContent);
    expect(termTexts).toContain('Σ');
    expect(termTexts).toContain('Γ');
    expect(termTexts).toContain('δ');
    expect(termTexts).toContain('Q');
    expect(termTexts).toContain('q');
  });

  it('uses a description list for semantic markup', () => {
    const { container } = render(<FormalDefinitionDisplay definition={singleStatePDA} />);
    const dl = container.querySelector('dl');
    expect(dl).toBeInTheDocument();
    const dtElements = container.querySelectorAll('dt');
    const ddElements = container.querySelectorAll('dd');
    expect(dtElements).toHaveLength(5);
    expect(ddElements).toHaveLength(5);
  });
});
