import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnnotationPanel } from './AnnotationPanel';

describe('AnnotationPanel', () => {
  it('renders the annotation text', () => {
    render(
      <AnnotationPanel
        annotation="Start configuration: state q, input &quot;aabb&quot; on tape, stack initialized with $."
        status="ready"
      />,
    );

    expect(screen.getByText(/Start configuration/)).toBeInTheDocument();
  });

  it('has an accessible region label', () => {
    render(<AnnotationPanel annotation="test" status="ready" />);
    expect(
      screen.getByRole('region', { name: 'Annotation panel' }),
    ).toBeInTheDocument();
  });

  it('uses aria-live="polite" for screen reader updates', () => {
    render(<AnnotationPanel annotation="test" status="running" />);
    const region = screen.getByRole('region', { name: 'Annotation panel' });
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('displays "Accepted" status badge when status is accepted', () => {
    render(
      <AnnotationPanel
        annotation="Accepted: stack is empty and head is past the last input symbol."
        status="accepted"
      />,
    );

    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('applies accepted styling when status is accepted', () => {
    render(<AnnotationPanel annotation="accepted" status="accepted" />);
    const panel = screen.getByRole('region', { name: 'Annotation panel' });
    expect(panel).toHaveClass('annotation-panel--accepted');
  });

  it('displays "Rejected" status badge when status is rejected', () => {
    render(
      <AnnotationPanel
        annotation="Rejected: no valid transition."
        status="rejected"
      />,
    );

    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('applies rejected styling when status is rejected', () => {
    render(<AnnotationPanel annotation="rejected" status="rejected" />);
    const panel = screen.getByRole('region', { name: 'Annotation panel' });
    expect(panel).toHaveClass('annotation-panel--rejected');
  });

  it('displays "Looping (Rejected)" status badge when status is looping', () => {
    render(
      <AnnotationPanel
        annotation="Rejected: configuration repeated."
        status="looping"
      />,
    );

    expect(screen.getByText('Looping (Rejected)')).toBeInTheDocument();
  });

  it('applies rejected styling when status is looping', () => {
    render(<AnnotationPanel annotation="looping" status="looping" />);
    const panel = screen.getByRole('region', { name: 'Annotation panel' });
    expect(panel).toHaveClass('annotation-panel--rejected');
  });

  it('does not show a status badge for ready status', () => {
    render(<AnnotationPanel annotation="ready" status="ready" />);
    const badges = screen.queryByText('Accepted');
    expect(badges).not.toBeInTheDocument();
    expect(screen.queryByText('Rejected')).not.toBeInTheDocument();
    expect(screen.queryByText('Looping (Rejected)')).not.toBeInTheDocument();
  });

  it('does not show a status badge for running status', () => {
    render(<AnnotationPanel annotation="running" status="running" />);
    expect(screen.queryByText('Accepted')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejected')).not.toBeInTheDocument();
  });

  it('does not apply outcome styling for running status', () => {
    render(<AnnotationPanel annotation="running" status="running" />);
    const panel = screen.getByRole('region', { name: 'Annotation panel' });
    expect(panel).not.toHaveClass('annotation-panel--accepted');
    expect(panel).not.toHaveClass('annotation-panel--rejected');
  });

  it('renders formal notation references in annotation text', () => {
    const annotation =
      'Applying transition qa$ → qR$S: reading \'a\' with $ on top, push S onto stack.';
    render(<AnnotationPanel annotation={annotation} status="running" />);

    expect(screen.getByText(annotation)).toBeInTheDocument();
  });
});
