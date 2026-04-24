import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StateControlDisplay } from './StateControlDisplay';

describe('StateControlDisplay', () => {
  it('renders all states as labeled nodes', () => {
    render(
      <StateControlDisplay
        states={['q0', 'q1', 'q2']}
        currentState="q0"
        previousState={null}
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toHaveTextContent('q0');
    expect(nodes[1]).toHaveTextContent('q1');
    expect(nodes[2]).toHaveTextContent('q2');
  });

  it('highlights the current active state with --active class', () => {
    render(
      <StateControlDisplay
        states={['q0', 'q1']}
        currentState="q1"
        previousState={null}
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes[0]).not.toHaveClass('state-control-display__node--active');
    expect(nodes[1]).toHaveClass('state-control-display__node--active');
  });

  it('sets aria-current on the active state only', () => {
    render(
      <StateControlDisplay
        states={['q0', 'q1']}
        currentState="q0"
        previousState={null}
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes[0]).toHaveAttribute('aria-current', 'true');
    expect(nodes[1]).not.toHaveAttribute('aria-current');
  });

  it('has an accessible region label', () => {
    render(
      <StateControlDisplay
        states={['q']}
        currentState="q"
        previousState={null}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'State control display' }),
    ).toBeInTheDocument();
  });

  it('applies entering animation when state changes to a new active state', () => {
    render(
      <StateControlDisplay
        states={['q0', 'q1']}
        currentState="q1"
        previousState="q0"
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes[1]).toHaveClass('state-control-display__node--entering');
    expect(nodes[0]).not.toHaveClass('state-control-display__node--entering');
  });

  it('applies leaving animation on the previous state when state changes', () => {
    render(
      <StateControlDisplay
        states={['q0', 'q1']}
        currentState="q1"
        previousState="q0"
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes[0]).toHaveClass('state-control-display__node--leaving');
    expect(nodes[1]).not.toHaveClass('state-control-display__node--leaving');
  });

  it('does not apply transition animations when previousState is null', () => {
    render(
      <StateControlDisplay
        states={['q0', 'q1']}
        currentState="q0"
        previousState={null}
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes[0]).not.toHaveClass('state-control-display__node--entering');
    expect(nodes[1]).not.toHaveClass('state-control-display__node--leaving');
  });

  it('does not apply transition animations when previousState equals currentState', () => {
    render(
      <StateControlDisplay
        states={['q']}
        currentState="q"
        previousState="q"
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes[0]).not.toHaveClass('state-control-display__node--entering');
    expect(nodes[0]).not.toHaveClass('state-control-display__node--leaving');
  });

  it('renders a single-state PDA correctly', () => {
    render(
      <StateControlDisplay
        states={['q']}
        currentState="q"
        previousState={null}
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toHaveTextContent('q');
    expect(nodes[0]).toHaveClass('state-control-display__node--active');
  });

  it('provides descriptive aria-labels for each state node', () => {
    render(
      <StateControlDisplay
        states={['q0', 'q1']}
        currentState="q0"
        previousState={null}
      />,
    );

    const nodes = screen.getAllByRole('listitem');
    expect(nodes[0]).toHaveAttribute('aria-label', 'State q0 (active)');
    expect(nodes[1]).toHaveAttribute('aria-label', 'State q1');
  });
});
