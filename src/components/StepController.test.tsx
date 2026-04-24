import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StepController } from './StepController';

describe('StepController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    status: 'running' as const,
    currentStep: 1,
    onStepForward: vi.fn(),
    onStepBackward: vi.fn(),
    onReset: vi.fn(),
  };

  it('renders all control buttons', () => {
    render(<StepController {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Step forward' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Step backward' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('has an accessible toolbar role and label', () => {
    render(<StepController {...defaultProps} />);
    expect(screen.getByRole('toolbar', { name: 'Simulation controls' })).toBeInTheDocument();
  });

  it('calls onStepForward when Step Forward is clicked', () => {
    const onStepForward = vi.fn();
    render(<StepController {...defaultProps} onStepForward={onStepForward} />);

    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(onStepForward).toHaveBeenCalledOnce();
  });

  it('calls onStepBackward when Step Backward is clicked', () => {
    const onStepBackward = vi.fn();
    render(<StepController {...defaultProps} onStepBackward={onStepBackward} />);

    fireEvent.click(screen.getByRole('button', { name: 'Step backward' }));
    expect(onStepBackward).toHaveBeenCalledOnce();
  });

  it('calls onReset when Reset is clicked', () => {
    const onReset = vi.fn();
    render(<StepController {...defaultProps} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('disables Step Forward when status is accepted', () => {
    render(<StepController {...defaultProps} status="accepted" />);
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeDisabled();
  });

  it('disables Step Forward when status is rejected', () => {
    render(<StepController {...defaultProps} status="rejected" />);
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeDisabled();
  });

  it('disables Step Forward when status is looping', () => {
    render(<StepController {...defaultProps} status="looping" />);
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeDisabled();
  });

  it('enables Step Forward when status is running', () => {
    render(<StepController {...defaultProps} status="running" />);
    expect(screen.getByRole('button', { name: 'Step forward' })).toBeEnabled();
  });

  it('disables Step Backward when currentStep is 0', () => {
    render(<StepController {...defaultProps} currentStep={0} />);
    expect(screen.getByRole('button', { name: 'Step backward' })).toBeDisabled();
  });

  it('enables Step Backward when currentStep > 0', () => {
    render(<StepController {...defaultProps} currentStep={3} />);
    expect(screen.getByRole('button', { name: 'Step backward' })).toBeEnabled();
  });

  it('shows Play button when not playing, and switches to Pause on click', () => {
    render(<StepController {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('switches back to Play when Pause is clicked', () => {
    render(<StepController {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
  });

  it('calls onStepForward repeatedly at the default delay during play', () => {
    const onStepForward = vi.fn();
    render(<StepController {...defaultProps} onStepForward={onStepForward} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    act(() => { vi.advanceTimersByTime(1000); });
    expect(onStepForward).toHaveBeenCalledTimes(1);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(onStepForward).toHaveBeenCalledTimes(2);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(onStepForward).toHaveBeenCalledTimes(3);
  });

  it('uses the custom playDelay for interval timing', () => {
    const onStepForward = vi.fn();
    render(
      <StepController {...defaultProps} onStepForward={onStepForward} playDelay={500} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    act(() => { vi.advanceTimersByTime(500); });
    expect(onStepForward).toHaveBeenCalledTimes(1);

    act(() => { vi.advanceTimersByTime(500); });
    expect(onStepForward).toHaveBeenCalledTimes(2);
  });

  it('stops calling onStepForward after Pause is clicked', () => {
    const onStepForward = vi.fn();
    render(<StepController {...defaultProps} onStepForward={onStepForward} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    act(() => { vi.advanceTimersByTime(1000); });
    expect(onStepForward).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    act(() => { vi.advanceTimersByTime(3000); });
    expect(onStepForward).toHaveBeenCalledTimes(1);
  });

  it('disables Play when status is terminal', () => {
    render(<StepController {...defaultProps} status="accepted" />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
  });

  it('auto-pauses when status becomes terminal during play', () => {
    const { rerender } = render(<StepController {...defaultProps} status="running" />);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    rerender(<StepController {...defaultProps} status="accepted" />);

    // Should switch back to showing Play (disabled)
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
  });

  it('clears play interval and calls onReset when Reset is clicked during play', () => {
    const onReset = vi.fn();
    const onStepForward = vi.fn();
    render(
      <StepController {...defaultProps} onReset={onReset} onStepForward={onStepForward} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledOnce();

    // Should be back to Play button (not Pause)
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();

    // Interval should be cleared — no more forward calls
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onStepForward).not.toHaveBeenCalled();
  });
});
