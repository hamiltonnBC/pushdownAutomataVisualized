import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExampleSelector } from './ExampleSelector';
import { allExamples } from '../data';

const [parentheses, zeroOneN, bMiddle] = allExamples;

describe('ExampleSelector', () => {
  it('renders three selectable options for the PDA examples', () => {
    render(
      <ExampleSelector
        examples={allExamples}
        currentExample={parentheses}
        onSelect={() => {}}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveTextContent('Properly Nested Parentheses');
    expect(radios[1]).toHaveTextContent('Strings of the form 0ⁿ1ⁿ');
    expect(radios[2]).toHaveTextContent('Strings with b in the middle (WIP)');
  });

  it('highlights the currently selected example', () => {
    render(
      <ExampleSelector
        examples={allExamples}
        currentExample={zeroOneN}
        onSelect={() => {}}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveClass('example-selector__option--active');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[2]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSelect with the clicked example', () => {
    const onSelect = vi.fn();

    render(
      <ExampleSelector
        examples={allExamples}
        currentExample={parentheses}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Strings with b in the middle (WIP)/ }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(bMiddle);
  });

  it('calls onSelect even when clicking the already-active example', () => {
    const onSelect = vi.fn();

    render(
      <ExampleSelector
        examples={allExamples}
        currentExample={parentheses}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Properly Nested Parentheses/ }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('has an accessible region label', () => {
    render(
      <ExampleSelector
        examples={allExamples}
        currentExample={parentheses}
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'Example selector' }),
    ).toBeInTheDocument();
  });

  it('wraps options in a radiogroup with a label', () => {
    render(
      <ExampleSelector
        examples={allExamples}
        currentExample={parentheses}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByText('PDA Examples')).toBeInTheDocument();
  });
});
