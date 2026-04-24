import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StringInput } from './StringInput';
import type { PredefinedInput } from '../types';

const alphabet = ['a', 'b'];

const predefined: PredefinedInput[] = [
  { value: 'aabb', expectedResult: 'accept', description: '(())' },
  { value: 'abab', expectedResult: 'accept', description: '()()' },
  { value: 'aab', expectedResult: 'reject', description: '(()' },
  { value: 'ba', expectedResult: 'reject', description: ')(' },
  { value: '', expectedResult: 'accept', description: 'empty string' },
];

describe('StringInput', () => {
  it('renders a text input and submit button', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={[]}
        onSubmit={() => {}}
      />,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
  });

  it('calls onSubmit with valid input on form submit', () => {
    const onSubmit = vi.fn();
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={[]}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'aabb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('aabb');
  });

  it('submits empty string as valid input', () => {
    const onSubmit = vi.fn();
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={[]}
        onSubmit={onSubmit}
      />,
    );

    // Input is empty by default
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('');
  });

  it('displays validation error with invalid symbols', () => {
    const onSubmit = vi.fn();
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={[]}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'axby' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSubmit).not.toHaveBeenCalled();
    const errorEl = screen.getByRole('alert');
    expect(errorEl).toHaveTextContent('Invalid symbols');
    expect(errorEl).toHaveTextContent('"x"');
    expect(errorEl).toHaveTextContent('"y"');
  });

  it('marks the input field as invalid when there is an error', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={[]}
        onSubmit={() => {}}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the error when the user types again', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={[]}
        onSubmit={() => {}}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders predefined example string buttons', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={predefined}
        onSubmit={() => {}}
      />,
    );

    expect(screen.getByText('Predefined Strings')).toBeInTheDocument();
    expect(screen.getByText('aabb')).toBeInTheDocument();
    expect(screen.getByText('abab')).toBeInTheDocument();
    expect(screen.getByText('aab')).toBeInTheDocument();
    expect(screen.getByText('ba')).toBeInTheDocument();
    // Empty string shown as ε
    expect(screen.getByText('ε')).toBeInTheDocument();
  });

  it('shows expected result and description for predefined strings', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={predefined}
        onSubmit={() => {}}
      />,
    );

    expect(screen.getByText('accept — (())')).toBeInTheDocument();
    expect(screen.getByText('reject — (()' )).toBeInTheDocument();
  });

  it('calls onSubmit with predefined string value on button click', () => {
    const onSubmit = vi.fn();
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={predefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Load "aabb"/));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('aabb');
  });

  it('calls onSubmit with empty string for the ε predefined button', () => {
    const onSubmit = vi.fn();
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={predefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Load "ε"/));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('');
  });

  it('has an accessible region label', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={predefined}
        onSubmit={() => {}}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'String input' }),
    ).toBeInTheDocument();
  });

  it('has an accessible group for predefined strings', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={predefined}
        onSubmit={() => {}}
      />,
    );

    expect(
      screen.getByRole('group', { name: 'Predefined input strings' }),
    ).toBeInTheDocument();
  });

  it('does not render predefined section when list is empty', () => {
    render(
      <StringInput
        tapeAlphabet={alphabet}
        predefinedInputs={[]}
        onSubmit={() => {}}
      />,
    );

    expect(screen.queryByText('Predefined Strings')).not.toBeInTheDocument();
  });
});
