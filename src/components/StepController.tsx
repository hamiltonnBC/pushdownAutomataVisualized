import { useState, useEffect, useRef, useCallback } from 'react';
import type { SimulatorState } from '../types';
import './StepController.css';

export interface StepControllerProps {
  /** Current simulator status */
  status: SimulatorState['status'];
  /** Current step number */
  currentStep: number;
  /** Callback to advance one computation step */
  onStepForward: () => void;
  /** Callback to reverse one computation step */
  onStepBackward: () => void;
  /** Callback to reset the simulator */
  onReset: () => void;
  /** Delay between auto-play steps in ms (default 1000) */
  playDelay?: number;
}

/**
 * Provides Step Forward, Step Backward, Reset, Play, and Pause controls
 * for the PDA simulator.
 *
 * Play uses setInterval to dispatch onStepForward repeatedly at the
 * configured delay. Pause clears the interval. Play and Pause are
 * mutually exclusive — only one is shown at a time.
 */
export function StepController({
  status,
  currentStep,
  onStepForward,
  onStepBackward,
  onReset,
  playDelay = 1000,
}: StepControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTerminal =
    status === 'accepted' || status === 'rejected' || status === 'looping';

  const clearPlay = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Auto-pause when a terminal state is reached
  useEffect(() => {
    if (isTerminal) {
      clearPlay();
    }
  }, [isTerminal, clearPlay]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  function handlePlay() {
    if (isTerminal) return;
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      onStepForward();
    }, playDelay);
  }

  function handlePause() {
    clearPlay();
  }

  function handleReset() {
    clearPlay();
    onReset();
  }

  return (
    <div
      className="step-controller"
      role="toolbar"
      aria-label="Simulation controls"
    >
      <button
        className="step-controller__btn step-controller__btn--backward"
        type="button"
        onClick={onStepBackward}
        disabled={currentStep === 0}
        aria-label="Step backward"
      >
        ⏮ Back
      </button>

      {isPlaying ? (
        <button
          className="step-controller__btn step-controller__btn--pause"
          type="button"
          onClick={handlePause}
          aria-label="Pause"
        >
          ⏸ Pause
        </button>
      ) : (
        <button
          className="step-controller__btn step-controller__btn--play"
          type="button"
          onClick={handlePlay}
          disabled={isTerminal}
          aria-label="Play"
        >
          ▶ Play
        </button>
      )}

      <button
        className="step-controller__btn step-controller__btn--forward"
        type="button"
        onClick={onStepForward}
        disabled={isTerminal}
        aria-label="Step forward"
      >
        Step ⏭
      </button>

      <button
        className="step-controller__btn step-controller__btn--reset"
        type="button"
        onClick={handleReset}
        aria-label="Reset"
      >
        ↺ Reset
      </button>
    </div>
  );
}
