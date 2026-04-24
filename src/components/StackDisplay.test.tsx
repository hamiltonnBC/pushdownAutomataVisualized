import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StackDisplay } from './StackDisplay';

describe('StackDisplay', () => {
  it('renders the correct number of cells for a given stack', () => {
    const stack = ['$', 'S', 'S'];
    render(<StackDisplay stack={stack} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells).toHaveLength(3);
  });

  it('displays each symbol in its cell', () => {
    const stack = ['$', 'S'];
    render(<StackDisplay stack={stack} />);

    const cells = screen.getAllByRole('listitem');
    // Display order is reversed: top first
    expect(cells[0]).toHaveTextContent('S');
    expect(cells[1]).toHaveTextContent('$');
  });

  it('renders top element at the visual top (first in DOM)', () => {
    const stack = ['$', 'A', 'B'];
    render(<StackDisplay stack={stack} />);

    const cells = screen.getAllByRole('listitem');
    // B is top of stack (last in array), should be first visually
    expect(cells[0]).toHaveTextContent('B');
    expect(cells[1]).toHaveTextContent('A');
    expect(cells[2]).toHaveTextContent('$');
  });

  it('highlights the top element with the --top class', () => {
    const stack = ['$', 'S'];
    render(<StackDisplay stack={stack} />);

    const cells = screen.getAllByRole('listitem');
    // First cell in display is the top element
    expect(cells[0]).toHaveClass('stack-display__cell--top');
    expect(cells[1]).not.toHaveClass('stack-display__cell--top');
  });

  it('applies bottom styling to $ at the bottom of the stack', () => {
    const stack = ['$', 'S'];
    render(<StackDisplay stack={stack} />);

    const cells = screen.getAllByRole('listitem');
    // Last cell in display is $ (bottom)
    expect(cells[1]).toHaveClass('stack-display__cell--bottom');
    expect(cells[0]).not.toHaveClass('stack-display__cell--bottom');
  });

  it('shows $ at bottom in start configuration', () => {
    const stack = ['$'];
    render(<StackDisplay stack={stack} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells).toHaveLength(1);
    expect(cells[0]).toHaveTextContent('$');
    // $ is both top and bottom when it's the only element
    expect(cells[0]).toHaveClass('stack-display__cell--top');
    expect(cells[0]).toHaveClass('stack-display__cell--bottom');
  });

  it('sets aria-current on the top element only', () => {
    const stack = ['$', 'S', 'S'];
    render(<StackDisplay stack={stack} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells[0]).toHaveAttribute('aria-current', 'true');
    expect(cells[1]).not.toHaveAttribute('aria-current');
    expect(cells[2]).not.toHaveAttribute('aria-current');
  });

  it('has an accessible region label', () => {
    render(<StackDisplay stack={['$']} />);
    expect(screen.getByRole('region', { name: 'Stack display' })).toBeInTheDocument();
  });

  it('applies push animation class for new elements when animating', () => {
    const previousStack = ['$'];
    const stack = ['$', 'S'];
    render(<StackDisplay stack={stack} previousStack={previousStack} isAnimating={true} />);

    const cells = screen.getAllByRole('listitem');
    // S is the new pushed element (top, first in display)
    expect(cells[0]).toHaveClass('stack-display__cell--push');
  });

  it('shows a popped element with pop animation when stack shrinks', () => {
    const previousStack = ['$', 'S'];
    const stack = ['$'];
    render(<StackDisplay stack={stack} previousStack={previousStack} isAnimating={true} />);

    const cells = screen.getAllByRole('listitem');
    // First cell should be the transient popped element
    expect(cells[0]).toHaveClass('stack-display__cell--pop');
    expect(cells[0]).toHaveTextContent('S');
    // Second cell is the remaining $
    expect(cells[1]).toHaveTextContent('$');
  });

  it('applies replace animation class when a symbol changes at the same position', () => {
    const previousStack = ['$', 'A'];
    const stack = ['$', 'B'];
    render(<StackDisplay stack={stack} previousStack={previousStack} isAnimating={true} />);

    const cells = screen.getAllByRole('listitem');
    // B replaced A at position 1 (top, first in display)
    expect(cells[0]).toHaveClass('stack-display__cell--replace');
  });

  it('does not apply animation classes when isAnimating is false', () => {
    const previousStack = ['$'];
    const stack = ['$', 'S'];
    render(<StackDisplay stack={stack} previousStack={previousStack} isAnimating={false} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells[0]).not.toHaveClass('stack-display__cell--push');
  });

  it('renders an empty stack with no cells', () => {
    render(<StackDisplay stack={[]} />);

    const cells = screen.queryAllByRole('listitem');
    expect(cells).toHaveLength(0);
  });
});
