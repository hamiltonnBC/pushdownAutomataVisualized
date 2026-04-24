import type { SimulatorState } from '../types';
import './AnnotationPanel.css';

export interface AnnotationPanelProps {
  /** Human-readable annotation text for the current computation step */
  annotation: string;
  /** Current simulator status, used to style accept/reject outcomes */
  status: SimulatorState['status'];
}

/**
 * Displays contextual educational annotations for the current PDA
 * computation step.
 *
 * - Shows formal notation references embedded in the annotation text.
 * - Applies distinct styling for accepted (green), rejected/looping (red),
 *   and neutral (running/ready) states.
 */
export function AnnotationPanel({ annotation, status }: AnnotationPanelProps) {
  const statusClass =
    status === 'accepted'
      ? 'annotation-panel--accepted'
      : status === 'rejected' || status === 'looping'
        ? 'annotation-panel--rejected'
        : '';

  const statusLabel =
    status === 'accepted'
      ? 'Accepted'
      : status === 'rejected'
        ? 'Rejected'
        : status === 'looping'
          ? 'Looping (Rejected)'
          : null;

  return (
    <div
      className={`annotation-panel ${statusClass}`.trim()}
      role="region"
      aria-label="Annotation panel"
      aria-live="polite"
    >
      <span className="annotation-panel__label">Annotation</span>

      {statusLabel && (
        <span className="annotation-panel__status">{statusLabel}</span>
      )}

      <p className="annotation-panel__text">{annotation}</p>
    </div>
  );
}
