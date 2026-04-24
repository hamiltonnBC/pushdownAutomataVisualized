import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TapeDisplay } from './TapeDisplay';

describe('TapeDisplay', () => {
  it('renders the correct number of cells for a given tape', () => {
    const tape = ['a', 'b', 'b', '□'];
    render(<TapeDisplay tape={tape} headPosition={0} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells).toHaveLength(4);
  });

  it('displays each symbol in its cell', () => {
    const tape = ['0', '1', '□'];
    render(<TapeDisplay tape={tape} headPosition={0} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells[0]).toHaveTextContent('0');
    expect(cells[1]).toHaveTextContent('1');
    expect(cells[2]).toHaveTextContent('□');
  });

  it('highlights the cell at headPosition', () => {
    const tape = ['a', 'b', '□'];
    render(<TapeDisplay tape={tape} headPosition={1} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells[1]).toHaveClass('tape-display__cell--active');
    expect(cells[0]).not.toHaveClass('tape-display__cell--active');
    expect(cells[2]).not.toHaveClass('tape-display__cell--active');
  });

  it('applies blank styling to the □ cell', () => {
    const tape = ['a', '□'];
    render(<TapeDisplay tape={tape} headPosition={0} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells[1]).toHaveClass('tape-display__cell--blank');
    expect(cells[0]).not.toHaveClass('tape-display__cell--blank');
  });

  it('sets aria-current on the active cell only', () => {
    const tape = ['a', 'b', '□'];
    render(<TapeDisplay tape={tape} headPosition={2} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells[2]).toHaveAttribute('aria-current', 'true');
    expect(cells[0]).not.toHaveAttribute('aria-current');
    expect(cells[1]).not.toHaveAttribute('aria-current');
  });

  it('renders an empty tape with just the blank symbol', () => {
    const tape = ['□'];
    render(<TapeDisplay tape={tape} headPosition={0} />);

    const cells = screen.getAllByRole('listitem');
    expect(cells).toHaveLength(1);
    expect(cells[0]).toHaveClass('tape-display__cell--active');
    expect(cells[0]).toHaveClass('tape-display__cell--blank');
  });

  it('has an accessible region label', () => {
    render(<TapeDisplay tape={['□']} headPosition={0} />);
    expect(screen.getByRole('region', { name: 'Tape display' })).toBeInTheDocument();
  });
});
